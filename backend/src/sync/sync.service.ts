import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryStatus,
  ContributionPaymentMethod,
  ContributionPaymentStatus,
  ContributionPlanStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyContactStatus,
  FamilyContactType,
  FamilyProjectCategory,
  FamilyProjectContributionStrategy,
  FamilyProjectStatus,
  IncomePaymentStatus,
  IncomeRecurrence,
  type Prisma,
  TransactionScope,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SyncCommandType,
  SyncPullQueryDto,
  SyncPushCommandDto,
  SyncPushDto,
} from './dto/sync.dto';

export type SyncCommandOutcome =
  | 'APPLIED'
  | 'DUPLICATE_IGNORED'
  | 'CONFLICT'
  | 'REJECTED'
  | 'FAILED_RETRYABLE';

export type SyncConflictCode =
  | 'VERSION_CONFLICT'
  | 'APPROVAL_STATE_CONFLICT'
  | 'PERMISSION_DENIED'
  | 'MEMBERSHIP_REVOKED'
  | 'CATEGORY_INACTIVE'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'TARGET_NOT_FOUND'
  | 'PARENT_COMMAND_FAILED'
  | 'ATTACHMENT_CHECKSUM_MISMATCH'
  | 'VALIDATION_FAILED';

export type SyncRecordType =
  | 'FAMILY'
  | 'MEMBER'
  | 'CATEGORY'
  | 'TRANSACTION'
  | 'RECEIPT'
  | 'CONTRIBUTION_PLAN'
  | 'CONTRIBUTION_CYCLE'
  | 'CONTRIBUTION_PAYMENT'
  | 'PROJECT'
  | 'CONTACT'
  | 'NOTIFICATION';

export interface SyncPushCommandResult {
  idempotencyKey: string;
  localRecordId: string;
  commandType: SyncCommandType;
  outcome: SyncCommandOutcome;
  serverRecordId: string | null;
  serverVersion: string | null;
  conflictCode: SyncConflictCode | null;
  message: string;
  serverRecord: Record<string, unknown> | null;
}

export interface SyncPullEntity {
  recordType: SyncRecordType;
  serverId: string;
  familyId: string;
  serverVersion: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdById: string | null;
  data: Record<string, unknown>;
}

export interface SyncTombstone {
  recordType: SyncRecordType;
  serverId: string;
  familyId: string;
  deletedAt: string;
  reason: string;
}

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB

type ActiveMembershipContext = {
  family: {
    id: string;
    name: string;
    slug: string;
    country: string;
    defaultCurrency: string;
    contributionCadence: string;
    type: string;
    description: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  };
  membership: {
    id: string;
    familyId: string;
    userId: string;
    authority: FamilyAuthority;
    capabilities: FamilyCapability[];
    removedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pull(
    userId: string,
    familyIdentifier: string,
    query: SyncPullQueryDto,
  ) {
    const { family, membership } = await this.requireActiveMembership(
      userId,
      familyIdentifier,
    );
    const cursorDate = this.parseCursor(query.cursor);
    const limit = query.limit ?? 250;
    const serverNow = new Date();

    const updatedFilter = cursorDate
      ? { gt: cursorDate }
      : undefined;

    const [
      members,
      categories,
      transactions,
      receipts,
      contributionPlans,
      contributionCycles,
      contributionPayments,
      projects,
      contacts,
      notifications,
    ] = await Promise.all([
      this.prisma.familyMember.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        include: {
          user: { select: { fullName: true, avatarUrl: true, email: true } },
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyTransactionCategory.findMany({
        where: {
          familyId: family.id,
          OR: [
            { scope: TransactionScope.FAMILY },
            { scope: TransactionScope.PERSONAL, ownerId: userId },
          ],
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyTransaction.findMany({
        where: {
          familyId: family.id,
          OR: [
            { scope: TransactionScope.FAMILY },
            { scope: TransactionScope.PERSONAL, createdById: userId },
          ],
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          createdBy: { select: { fullName: true } },
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyReceipt.findMany({
        where: {
          familyId: family.id,
          transaction: {
            OR: [
              { scope: TransactionScope.FAMILY },
              { scope: TransactionScope.PERSONAL, createdById: userId },
            ],
          },
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyContributionPlan.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyContributionCycle.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyContributionPayment.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        include: {
          plan: { select: { name: true } },
          member: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyProject.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.familyContact.findMany({
        where: {
          familyId: family.id,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        include: {
          createdBy: { select: { fullName: true } },
          displayNames: { where: { userId } },
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
      this.prisma.notification.findMany({
        where: {
          familyId: family.id,
          userId,
          ...(updatedFilter ? { updatedAt: updatedFilter } : {}),
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: limit,
      }),
    ]);

    const entities: SyncPullEntity[] = [];
    const tombstones: SyncTombstone[] = [];
    let maxUpdatedAt = cursorDate ?? new Date(0);
    let lastEntityId = family.id;

    const trackWatermark = (updatedAt: Date, id: string) => {
      if (updatedAt.getTime() >= maxUpdatedAt.getTime()) {
        maxUpdatedAt = updatedAt;
        lastEntityId = id;
      }
    };

    if (!cursorDate || family.updatedAt > cursorDate) {
      trackWatermark(family.updatedAt, family.id);
      entities.push({
        recordType: 'FAMILY',
        serverId: family.id,
        familyId: family.id,
        serverVersion: family.updatedAt.toISOString(),
        createdAt: family.createdAt.toISOString(),
        updatedAt: family.updatedAt.toISOString(),
        deletedAt: null,
        createdById: family.createdById,
        data: {
          id: family.id,
          name: family.name,
          slug: family.slug,
          country: family.country,
          defaultCurrency: family.defaultCurrency,
          contributionCadence: family.contributionCadence,
          type: family.type,
          description: family.description,
          authority: membership.authority,
          capabilities: membership.capabilities,
        },
      });
    }

    for (const member of members) {
      trackWatermark(member.updatedAt, member.id);
      if (member.removedAt) {
        tombstones.push({
          recordType: 'MEMBER',
          serverId: member.id,
          familyId: family.id,
          deletedAt: member.removedAt.toISOString(),
          reason: 'MEMBER_REMOVED',
        });
      } else {
        entities.push({
          recordType: 'MEMBER',
          serverId: member.id,
          familyId: family.id,
          serverVersion: member.updatedAt.toISOString(),
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
          deletedAt: null,
          createdById: null,
          data: {
            id: member.id,
            familyId: member.familyId,
            userId: member.userId,
            fullName: member.user.fullName,
            avatarUrl: member.user.avatarUrl,
            authority: member.authority,
            kinshipLabel: member.kinshipLabel,
            kinshipCustom: member.kinshipCustom,
            capabilities: member.capabilities,
          },
        });
      }
    }

    for (const category of categories) {
      trackWatermark(category.updatedAt, category.id);
      if (category.status === CategoryStatus.INACTIVE) {
        tombstones.push({
          recordType: 'CATEGORY',
          serverId: category.id,
          familyId: family.id,
          deletedAt: category.updatedAt.toISOString(),
          reason: 'CATEGORY_ARCHIVED',
        });
      }
      entities.push({
        recordType: 'CATEGORY',
        serverId: category.id,
        familyId: family.id,
        serverVersion: category.updatedAt.toISOString(),
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        deletedAt:
          category.status === CategoryStatus.INACTIVE
            ? category.updatedAt.toISOString()
            : null,
        createdById: category.createdById,
        data: {
          id: category.id,
          familyId: category.familyId,
          name: category.name,
          type: category.type,
          description: category.description,
          icon: category.icon,
          color: category.color,
          status: category.status,
          isDefault: category.isDefault,
          scope: category.scope,
          ownerId: category.ownerId,
        },
      });
    }

    for (const tx of transactions) {
      trackWatermark(tx.updatedAt, tx.id);
      if (tx.status === TransactionStatus.REVERSED || tx.reversedAt) {
        tombstones.push({
          recordType: 'TRANSACTION',
          serverId: tx.id,
          familyId: family.id,
          deletedAt: (tx.reversedAt ?? tx.updatedAt).toISOString(),
          reason: 'TRANSACTION_REVERSED',
        });
      }
      entities.push({
        recordType: 'TRANSACTION',
        serverId: tx.id,
        familyId: family.id,
        serverVersion: tx.updatedAt.toISOString(),
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
        deletedAt: tx.reversedAt?.toISOString() ?? null,
        createdById: tx.createdById,
        data: this.serializeTransactionRecord(tx),
      });
    }

    for (const receipt of receipts) {
      trackWatermark(receipt.updatedAt, receipt.id);
      entities.push({
        recordType: 'RECEIPT',
        serverId: receipt.id,
        familyId: family.id,
        serverVersion: receipt.updatedAt.toISOString(),
        createdAt: receipt.createdAt.toISOString(),
        updatedAt: receipt.updatedAt.toISOString(),
        deletedAt: null,
        createdById: receipt.uploadedById,
        data: {
          id: receipt.id,
          familyId: receipt.familyId,
          transactionId: receipt.transactionId,
          fileName: receipt.fileName,
          fileType: receipt.fileType,
          fileSizeBytes: receipt.fileSizeBytes,
          storageKey: receipt.storageKey,
          checksumSha256: receipt.checksumSha256,
          uploadedById: receipt.uploadedById,
        },
      });
    }

    for (const plan of contributionPlans) {
      trackWatermark(plan.updatedAt, plan.id);
      if (plan.archivedAt || plan.status === ContributionPlanStatus.ARCHIVED) {
        tombstones.push({
          recordType: 'CONTRIBUTION_PLAN',
          serverId: plan.id,
          familyId: family.id,
          deletedAt: (plan.archivedAt ?? plan.updatedAt).toISOString(),
          reason: 'CONTRIBUTION_PLAN_ARCHIVED',
        });
      }
      entities.push({
        recordType: 'CONTRIBUTION_PLAN',
        serverId: plan.id,
        familyId: family.id,
        serverVersion: plan.updatedAt.toISOString(),
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        deletedAt: plan.archivedAt?.toISOString() ?? null,
        createdById: plan.createdById,
        data: {
          id: plan.id,
          familyId: plan.familyId,
          name: plan.name,
          description: plan.description,
          cadence: plan.cadence,
          amountMinorUnits: plan.amountMinorUnits.toString(),
          currency: plan.currency,
          status: plan.status,
        },
      });
    }

    for (const cycle of contributionCycles) {
      trackWatermark(cycle.updatedAt, cycle.id);
      entities.push({
        recordType: 'CONTRIBUTION_CYCLE',
        serverId: cycle.id,
        familyId: family.id,
        serverVersion: cycle.updatedAt.toISOString(),
        createdAt: cycle.createdAt.toISOString(),
        updatedAt: cycle.updatedAt.toISOString(),
        deletedAt: null,
        createdById: null,
        data: {
          id: cycle.id,
          familyId: cycle.familyId,
          planId: cycle.planId,
          label: cycle.label,
          periodStart: cycle.periodStart.toISOString(),
          periodEnd: cycle.periodEnd.toISOString(),
          dueDate: cycle.dueDate.toISOString(),
          expectedMinorUnits: cycle.expectedMinorUnits.toString(),
          status: cycle.status,
        },
      });
    }

    for (const payment of contributionPayments) {
      trackWatermark(payment.updatedAt, payment.id);
      if (
        payment.reversedAt ||
        payment.status === ContributionPaymentStatus.REVERSED
      ) {
        tombstones.push({
          recordType: 'CONTRIBUTION_PAYMENT',
          serverId: payment.id,
          familyId: family.id,
          deletedAt: (payment.reversedAt ?? payment.updatedAt).toISOString(),
          reason: 'CONTRIBUTION_PAYMENT_REVERSED',
        });
      }
      entities.push({
        recordType: 'CONTRIBUTION_PAYMENT',
        serverId: payment.id,
        familyId: family.id,
        serverVersion: payment.updatedAt.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        deletedAt: payment.reversedAt?.toISOString() ?? null,
        createdById: payment.recordedById,
        data: {
          id: payment.id,
          familyId: payment.familyId,
          planId: payment.planId,
          planName: payment.plan?.name ?? null,
          cycleId: payment.cycleId,
          memberId: payment.memberId,
          memberName: payment.member?.user?.fullName ?? null,
          amountMinorUnits: payment.amountMinorUnits.toString(),
          method: payment.method,
          status: payment.status,
          reference: payment.reference,
          note: payment.note,
          paidAt: payment.paidAt.toISOString(),
          recordedById: payment.recordedById,
        },
      });
    }

    for (const project of projects) {
      trackWatermark(project.updatedAt, project.id);
      if (project.archivedAt || project.status === FamilyProjectStatus.CANCELLED) {
        tombstones.push({
          recordType: 'PROJECT',
          serverId: project.id,
          familyId: family.id,
          deletedAt: (project.archivedAt ?? project.updatedAt).toISOString(),
          reason: 'PROJECT_ARCHIVED',
        });
      }
      entities.push({
        recordType: 'PROJECT',
        serverId: project.id,
        familyId: family.id,
        serverVersion: project.updatedAt.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        deletedAt: project.archivedAt?.toISOString() ?? null,
        createdById: project.createdById,
        data: {
          id: project.id,
          familyId: project.familyId,
          name: project.name,
          category: project.category,
          description: project.description,
          targetAmountMinorUnits: project.targetAmountMinorUnits.toString(),
          currency: project.currency,
          startDate: project.startDate?.toISOString() ?? null,
          targetDate: project.targetDate.toISOString(),
          status: project.status,
          contributionStrategy: project.contributionStrategy,
          expectedContributionMinorUnits:
            project.expectedContributionMinorUnits?.toString() ?? null,
        },
      });
    }

    for (const contact of contacts) {
      trackWatermark(contact.updatedAt, contact.id);
      if (contact.deletedAt || contact.status === FamilyContactStatus.INACTIVE) {
        tombstones.push({
          recordType: 'CONTACT',
          serverId: contact.id,
          familyId: family.id,
          deletedAt: (contact.deletedAt ?? contact.updatedAt).toISOString(),
          reason: 'CONTACT_DELETED',
        });
      } else {
        const displayName = (contact.displayNames ?? [])[0]?.fullName;
        entities.push({
          recordType: 'CONTACT',
          serverId: contact.id,
          familyId: family.id,
          serverVersion: contact.updatedAt.toISOString(),
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
          deletedAt: null,
          createdById: contact.createdById,
          data: {
            id: contact.id,
            familyId: contact.familyId,
            fullName: displayName ?? contact.fullName,
            contactType: contact.contactType,
            phoneNumber: contact.phoneNumber,
            email: contact.email,
            address: contact.address,
            relationshipToFamily: contact.relationshipToFamily,
            organization: contact.organization,
            notes: contact.notes,
            isEmergencyContact: contact.isEmergencyContact,
            isLoanContact: contact.isLoanContact,
            status: contact.status,
          },
        });
      }
    }

    for (const notification of notifications) {
      trackWatermark(notification.updatedAt, notification.id);
      entities.push({
        recordType: 'NOTIFICATION',
        serverId: notification.id,
        familyId: family.id,
        serverVersion: notification.updatedAt.toISOString(),
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
        deletedAt: null,
        createdById: null,
        data: {
          id: notification.id,
          familyId: notification.familyId,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          description: notification.description,
          href: notification.href,
          readAt: notification.readAt?.toISOString() ?? null,
        },
      });
    }

    const effectiveCursorDate =
      maxUpdatedAt.getTime() > 0 ? maxUpdatedAt : serverNow;
    const nextCursor = this.formatCursor(effectiveCursorDate, lastEntityId);

    return {
      contractVersion: '1.0.0',
      familyId: family.id,
      familySlug: family.slug,
      serverTimestamp: serverNow.toISOString(),
      nextCursor,
      hasMore: false,
      membership: {
        memberId: membership.id,
        userId: membership.userId,
        authority: membership.authority,
        capabilities: membership.capabilities,
        removedAt: null,
      },
      entities,
      tombstones,
    };
  }

  async push(
    userId: string,
    familyIdentifier: string,
    dto: SyncPushDto,
  ) {
    const { family, membership } = await this.requireActiveMembership(
      userId,
      familyIdentifier,
    );
    const serverNow = new Date();
    const results: SyncPushCommandResult[] = [];
    const failedLocalIds = new Set<string>();
    const resolvedLocalToServerId = new Map<string, string>();

    for (const command of dto.commands) {
      if (
        command.dependsOnLocalId &&
        failedLocalIds.has(command.dependsOnLocalId)
      ) {
        failedLocalIds.add(command.localRecordId);
        results.push({
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          outcome: 'REJECTED',
          serverRecordId: null,
          serverVersion: null,
          conflictCode: 'PARENT_COMMAND_FAILED',
          message: `Skipped because parent command (${command.dependsOnLocalId}) did not succeed.`,
          serverRecord: null,
        });
        continue;
      }

      const result = await this.processPushCommand(
        userId,
        dto.deviceId,
        family,
        membership,
        command,
        resolvedLocalToServerId,
      );

      if (
        result.outcome === 'APPLIED' ||
        result.outcome === 'DUPLICATE_IGNORED'
      ) {
        if (result.serverRecordId) {
          resolvedLocalToServerId.set(
            command.localRecordId,
            result.serverRecordId,
          );
        }
      } else {
        failedLocalIds.add(command.localRecordId);
      }

      results.push(result);
    }

    return {
      contractVersion: '1.0.0',
      familyId: family.id,
      familySlug: family.slug,
      serverTimestamp: serverNow.toISOString(),
      results,
    };
  }

  private async processPushCommand(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    resolvedLocalToServerId: Map<string, string>,
  ): Promise<SyncPushCommandResult> {
    const payloadHash = this.hashCommandPayload(command);

    const existingMutation = await this.prisma.familySyncMutation.findUnique({
      where: {
        familyId_idempotencyKey: {
          familyId: family.id,
          idempotencyKey: command.idempotencyKey,
        },
      },
    });

    if (existingMutation) {
      if (
        existingMutation.actorId !== userId ||
        existingMutation.commandType !== command.commandType ||
        existingMutation.payloadHash !== payloadHash
      ) {
        return {
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          outcome: 'CONFLICT',
          serverRecordId: null,
          serverVersion: null,
          conflictCode: 'IDEMPOTENCY_KEY_REUSED',
          message:
            'Idempotency key was already used with a different command or payload.',
          serverRecord: null,
        };
      }

      const cachedResponse = existingMutation.responseJson as Record<
        string,
        unknown
      >;
      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'DUPLICATE_IGNORED',
        serverRecordId: existingMutation.serverRecordId,
        serverVersion:
          (cachedResponse.serverVersion as string | null | undefined) ?? null,
        conflictCode:
          (existingMutation.conflictCode as SyncConflictCode | null) ?? null,
        message: 'Command already applied idempotently.',
        serverRecord:
          (cachedResponse.serverRecord as Record<string, unknown> | null) ??
          null,
      };
    }

    switch (command.commandType) {
      case 'CREATE_EXPENSE':
        return this.executeCreateTransaction(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
          TransactionType.EXPENSE,
          TransactionScope.FAMILY,
        );
      case 'CREATE_INCOME':
        return this.executeCreateTransaction(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
          TransactionType.INCOME,
          TransactionScope.FAMILY,
        );
      case 'CREATE_PERSONAL_TRANSACTION': {
        const rawType = String(command.payload.type ?? 'EXPENSE').toUpperCase();
        const txType =
          rawType === 'INCOME'
            ? TransactionType.INCOME
            : TransactionType.EXPENSE;
        return this.executeCreateTransaction(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
          txType,
          TransactionScope.PERSONAL,
        );
      }
      case 'UPDATE_TRANSACTION_NOTES':
        return this.executeUpdateTransactionNotes(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
        );
      case 'RECORD_CONTRIBUTION_PAYMENT':
        return this.executeRecordContributionPayment(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
        );
      case 'CREATE_PROJECT':
        return this.executeCreateProject(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
        );
      case 'CREATE_CONTACT':
        return this.executeCreateContact(
          userId,
          deviceId,
          family,
          command,
          payloadHash,
        );
      case 'UPDATE_CONTACT':
        return this.executeUpdateContact(
          userId,
          deviceId,
          family,
          membership,
          command,
          payloadHash,
        );
      case 'ATTACH_RECEIPT':
        return this.executeAttachReceipt(
          userId,
          deviceId,
          family,
          command,
          payloadHash,
          resolvedLocalToServerId,
        );
    }
  }

  private async executeCreateTransaction(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    payloadHash: string,
    type: TransactionType,
    scope: TransactionScope,
  ): Promise<SyncPushCommandResult> {
    if (scope === TransactionScope.FAMILY) {
      const requiredCap =
        type === TransactionType.INCOME
          ? FamilyCapability.RECORD_INCOME
          : FamilyCapability.RECORD_EXPENSE;

      if (!can(membership, requiredCap)) {
        return this.recordRejectedMutation(
          userId,
          deviceId,
          family.id,
          command,
          payloadHash,
          'PERMISSION_DENIED',
          `You no longer have permission (${requiredCap}) to record this ${type.toLowerCase()}.`,
        );
      }
    }

    const payload = command.payload;
    const categoryId = this.asNonEmptyString(payload.categoryId);
    const amountStr = this.asNonEmptyString(payload.amountMinorUnits);
    const currency =
      this.asNonEmptyString(payload.currency) ?? family.defaultCurrency;
    const dateStr = this.asNonEmptyString(payload.date);

    if (!categoryId || !amountStr || !/^\d+$/.test(amountStr) || !dateStr) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'categoryId, positive integer amountMinorUnits, and valid ISO date are required.',
      );
    }

    const amountMinorUnits = BigInt(amountStr);
    const parsedDate = new Date(dateStr);
    if (amountMinorUnits <= 0n || Number.isNaN(parsedDate.getTime())) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Transaction amountMinorUnits must be greater than zero and date must be valid.',
      );
    }

    const category = await this.prisma.familyTransactionCategory.findFirst({
      where: {
        id: categoryId,
        familyId: family.id,
        type,
        scope,
        ownerId: scope === TransactionScope.PERSONAL ? userId : null,
      },
    });

    if (!category || category.status !== CategoryStatus.ACTIVE) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'CATEGORY_INACTIVE',
        'Selected category does not exist in this family or has been archived.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingTx = await tx.familyTransaction.findUnique({
        where: {
          familyId_idempotencyKey: {
            familyId: family.id,
            idempotencyKey: command.idempotencyKey,
          },
        },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          createdBy: { select: { fullName: true } },
        },
      });

      if (existingTx) {
        const serializedExisting = this.serializeTransactionRecord(existingTx);
        return {
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          outcome: 'DUPLICATE_IGNORED' as const,
          serverRecordId: existingTx.id,
          serverVersion: existingTx.updatedAt.toISOString(),
          conflictCode: null,
          message: 'Transaction already recorded for this idempotency key.',
          serverRecord: serializedExisting,
        };
      }

      const created = await tx.familyTransaction.create({
        data: {
          familyId: family.id,
          createdById: userId,
          categoryId: category.id,
          amountMinorUnits,
          currency,
          type,
          scope,
          status:
            scope === TransactionScope.PERSONAL
              ? TransactionStatus.APPROVED
              : TransactionStatus.PENDING,
          incomeRecurrence: IncomeRecurrence.ONE_TIME,
          paymentStatus: IncomePaymentStatus.NOT_EXPECTED,
          date: parsedDate,
          description: this.asNullableString(payload.description),
          paymentMethod: this.asNullableString(payload.paymentMethod),
          notes: this.asNullableString(payload.notes),
          receivedFrom: this.asNullableString(payload.receivedFrom),
          receivedBy: this.asNullableString(payload.receivedBy),
          idempotencyKey: command.idempotencyKey,
        },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          createdBy: { select: { fullName: true } },
        },
      });

      const serialized = this.serializeTransactionRecord(created);
      const serverVersion = created.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.TRANSACTION_CREATED,
          after: {
            id: created.id,
            type: created.type,
            scope: created.scope,
            status: created.status,
            amountMinorUnits: created.amountMinorUnits.toString(),
            currency: created.currency,
            idempotencyKey: command.idempotencyKey,
            syncedFromDeviceId: deviceId,
          },
        },
      });

      const result: SyncPushCommandResult = {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: created.id,
        serverVersion,
        conflictCode: null,
        message: 'Transaction synchronized and persisted.',
        serverRecord: serialized,
      };

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: result.outcome,
          serverRecordId: created.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return result;
    });
  }

  private async executeUpdateTransactionNotes(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    payloadHash: string,
  ): Promise<SyncPushCommandResult> {
    const serverRecordId = this.asNonEmptyString(
      command.payload.serverRecordId,
    );
    if (!serverRecordId) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'serverRecordId is required to update transaction notes.',
      );
    }

    const existing = await this.prisma.familyTransaction.findFirst({
      where: { id: serverRecordId, familyId: family.id },
      include: {
        category: { select: { name: true, icon: true, color: true } },
        createdBy: { select: { fullName: true } },
      },
    });

    if (!existing) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'TARGET_NOT_FOUND',
        'Target transaction was not found in this family.',
      );
    }

    const isHeadOrAdmin =
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN;

    if (existing.createdById !== userId && !isHeadOrAdmin) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'PERMISSION_DENIED',
        'You cannot edit notes on another member transaction.',
      );
    }

    if (
      existing.scope === TransactionScope.FAMILY &&
      existing.status !== TransactionStatus.PENDING
    ) {
      return this.recordConflictMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'APPROVAL_STATE_CONFLICT',
        `Transaction is already ${existing.status.toLowerCase()} on the server and cannot be modified by an offline draft edit.`,
        existing.id,
        existing.updatedAt.toISOString(),
        this.serializeTransactionRecord(existing),
      );
    }

    if (
      command.baseVersion &&
      command.baseVersion !== existing.updatedAt.toISOString()
    ) {
      return this.recordConflictMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VERSION_CONFLICT',
        'Transaction was modified on the server since your offline edit was queued.',
        existing.id,
        existing.updatedAt.toISOString(),
        this.serializeTransactionRecord(existing),
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyTransaction.update({
        where: { id: existing.id },
        data: {
          description:
            command.payload.description !== undefined
              ? this.asNullableString(command.payload.description)
              : existing.description,
          notes:
            command.payload.notes !== undefined
              ? this.asNullableString(command.payload.notes)
              : existing.notes,
        },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          createdBy: { select: { fullName: true } },
        },
      });

      const serialized = this.serializeTransactionRecord(updated);
      const serverVersion = updated.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.TRANSACTION_UPDATED,
          before: {
            description: existing.description,
            notes: existing.notes,
          },
          after: {
            description: updated.description,
            notes: updated.notes,
          },
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: updated.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: updated.id,
        serverVersion,
        conflictCode: null,
        message: 'Transaction notes updated.',
        serverRecord: serialized,
      };
    });
  }

  private async executeRecordContributionPayment(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    payloadHash: string,
  ): Promise<SyncPushCommandResult> {
    if (!can(membership, FamilyCapability.MANAGE_CONTRIBUTIONS)) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'PERMISSION_DENIED',
        'You do not have MANAGE_CONTRIBUTIONS permission to record contribution payments.',
      );
    }

    const planId = this.asNonEmptyString(command.payload.planId);
    const memberId =
      this.asNonEmptyString(command.payload.memberId) ?? membership.id;
    const amountStr = this.asNonEmptyString(command.payload.amountMinorUnits);
    const paidAtStr = this.asNonEmptyString(command.payload.paidAt);

    if (!planId || !amountStr || !/^\d+$/.test(amountStr) || !paidAtStr) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'planId, positive amountMinorUnits, and paidAt are required.',
      );
    }

    const amountMinorUnits = BigInt(amountStr);
    const paidAt = new Date(paidAtStr);
    if (amountMinorUnits <= 0n || Number.isNaN(paidAt.getTime())) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Contribution payment amount must be positive and paidAt must be valid.',
      );
    }

    const plan = await this.prisma.familyContributionPlan.findFirst({
      where: {
        id: planId,
        familyId: family.id,
        status: ContributionPlanStatus.ACTIVE,
      },
    });
    if (!plan) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'TARGET_NOT_FOUND',
        'Active contribution plan not found in this family.',
      );
    }

    const targetMember = await this.prisma.familyMember.findFirst({
      where: { id: memberId, familyId: family.id, removedAt: null },
      include: { user: { select: { fullName: true } } },
    });
    if (!targetMember) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'TARGET_NOT_FOUND',
        'Target family member not found.',
      );
    }

    const rawMethod = String(command.payload.method ?? 'CASH').toUpperCase();
    const method = Object.values(ContributionPaymentMethod).includes(
      rawMethod as ContributionPaymentMethod,
    )
      ? (rawMethod as ContributionPaymentMethod)
      : ContributionPaymentMethod.CASH;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyContributionPayment.create({
        data: {
          familyId: family.id,
          planId: plan.id,
          cycleId: this.asNullableString(command.payload.cycleId),
          memberId: targetMember.id,
          amountMinorUnits,
          method,
          status: ContributionPaymentStatus.PENDING,
          reference: this.asNullableString(command.payload.reference),
          note: this.asNullableString(command.payload.note),
          idempotencyKey: command.idempotencyKey,
          paidAt,
          recordedById: userId,
        },
      });

      const serialized = {
        id: created.id,
        familyId: created.familyId,
        planId: created.planId,
        planName: plan.name,
        cycleId: created.cycleId,
        memberId: created.memberId,
        memberName: targetMember.user.fullName,
        amountMinorUnits: created.amountMinorUnits.toString(),
        method: created.method,
        status: created.status,
        reference: created.reference,
        note: created.note,
        paidAt: created.paidAt.toISOString(),
        recordedById: created.recordedById,
      };
      const serverVersion = created.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.CONTRIBUTION_RECORDED,
          after: serialized,
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: created.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: created.id,
        serverVersion,
        conflictCode: null,
        message: 'Contribution payment recorded for verification.',
        serverRecord: serialized,
      };
    });
  }

  private async executeCreateProject(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    payloadHash: string,
  ): Promise<SyncPushCommandResult> {
    if (!can(membership, FamilyCapability.MANAGE_PROJECTS)) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'PERMISSION_DENIED',
        'You do not have MANAGE_PROJECTS permission to create family projects.',
      );
    }

    const name = this.asNonEmptyString(command.payload.name);
    const targetAmountStr = this.asNonEmptyString(
      command.payload.targetAmountMinorUnits,
    );
    const targetDateStr = this.asNonEmptyString(command.payload.targetDate);

    if (
      !name ||
      !targetAmountStr ||
      !/^\d+$/.test(targetAmountStr) ||
      !targetDateStr
    ) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Project name, positive targetAmountMinorUnits, and targetDate are required.',
      );
    }

    const targetAmountMinorUnits = BigInt(targetAmountStr);
    const targetDate = new Date(targetDateStr);
    if (targetAmountMinorUnits <= 0n || Number.isNaN(targetDate.getTime())) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Project targetAmountMinorUnits must be positive and targetDate valid.',
      );
    }

    const rawCategory = String(
      command.payload.category ?? 'OTHER',
    ).toUpperCase();
    const category = Object.values(FamilyProjectCategory).includes(
      rawCategory as FamilyProjectCategory,
    )
      ? (rawCategory as FamilyProjectCategory)
      : FamilyProjectCategory.OTHER;

    const rawStrategy = String(
      command.payload.contributionStrategy ?? 'AS_AVAILABLE',
    ).toUpperCase();
    const contributionStrategy = Object.values(
      FamilyProjectContributionStrategy,
    ).includes(rawStrategy as FamilyProjectContributionStrategy)
      ? (rawStrategy as FamilyProjectContributionStrategy)
      : FamilyProjectContributionStrategy.AS_AVAILABLE;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyProject.create({
        data: {
          familyId: family.id,
          name,
          category,
          description: this.asNullableString(command.payload.description),
          targetAmountMinorUnits,
          currency:
            this.asNonEmptyString(command.payload.currency) ??
            family.defaultCurrency,
          targetDate,
          status: FamilyProjectStatus.ACTIVE,
          ownerMemberId: membership.id,
          contributionStrategy,
          idempotencyKey: command.idempotencyKey,
          createdById: userId,
        },
      });

      const serialized = {
        id: created.id,
        familyId: created.familyId,
        name: created.name,
        category: created.category,
        description: created.description,
        targetAmountMinorUnits: created.targetAmountMinorUnits.toString(),
        currency: created.currency,
        targetDate: created.targetDate.toISOString(),
        status: created.status,
        contributionStrategy: created.contributionStrategy,
      };
      const serverVersion = created.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.PROJECT_CREATED,
          after: serialized,
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: created.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: created.id,
        serverVersion,
        conflictCode: null,
        message: 'Project created and synchronized.',
        serverRecord: serialized,
      };
    });
  }

  private async executeCreateContact(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    command: SyncPushCommandDto,
    payloadHash: string,
  ): Promise<SyncPushCommandResult> {
    const fullName = this.asNonEmptyString(command.payload.fullName);
    if (!fullName) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Contact fullName is required.',
      );
    }

    const rawType = String(
      command.payload.contactType ?? 'OTHER',
    ).toUpperCase();
    const contactType = Object.values(FamilyContactType).includes(
      rawType as FamilyContactType,
    )
      ? (rawType as FamilyContactType)
      : FamilyContactType.OTHER;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyContact.create({
        data: {
          familyId: family.id,
          fullName,
          contactType,
          phoneNumber: this.asNullableString(command.payload.phoneNumber),
          email: this.asNullableString(command.payload.email),
          address: this.asNullableString(command.payload.address),
          relationshipToFamily: this.asNullableString(
            command.payload.relationshipToFamily,
          ),
          organization: this.asNullableString(command.payload.organization),
          notes: this.asNullableString(command.payload.notes),
          isEmergencyContact: Boolean(command.payload.isEmergencyContact),
          isLoanContact: Boolean(command.payload.isLoanContact),
          status: FamilyContactStatus.ACTIVE,
          createdById: userId,
        },
      });

      const serialized = {
        id: created.id,
        familyId: created.familyId,
        fullName: created.fullName,
        contactType: created.contactType,
        phoneNumber: created.phoneNumber,
        email: created.email,
        address: created.address,
        relationshipToFamily: created.relationshipToFamily,
        organization: created.organization,
        notes: created.notes,
        isEmergencyContact: created.isEmergencyContact,
        isLoanContact: created.isLoanContact,
        status: created.status,
      };
      const serverVersion = created.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.CONTACT_CREATED,
          after: serialized,
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: created.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: created.id,
        serverVersion,
        conflictCode: null,
        message: 'Contact created and synchronized.',
        serverRecord: serialized,
      };
    });
  }

  private async executeUpdateContact(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    membership: ActiveMembershipContext['membership'],
    command: SyncPushCommandDto,
    payloadHash: string,
  ): Promise<SyncPushCommandResult> {
    const serverRecordId = this.asNonEmptyString(
      command.payload.serverRecordId,
    );
    if (!serverRecordId) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'serverRecordId is required to update a contact.',
      );
    }

    const existing = await this.prisma.familyContact.findFirst({
      where: { id: serverRecordId, familyId: family.id, deletedAt: null },
    });
    if (!existing) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'TARGET_NOT_FOUND',
        'Contact not found or was deleted.',
      );
    }

    const canManageContact =
      existing.createdById === userId ||
      membership.authority === FamilyAuthority.HEAD ||
      membership.authority === FamilyAuthority.ADMIN ||
      can(membership, FamilyCapability.MANAGE_CONTACTS);

    if (!canManageContact) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'PERMISSION_DENIED',
        'You do not have permission to edit this contact.',
      );
    }

    if (
      command.baseVersion &&
      command.baseVersion !== existing.updatedAt.toISOString()
    ) {
      return this.recordConflictMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VERSION_CONFLICT',
        'Contact was updated on the server since your offline edit.',
        existing.id,
        existing.updatedAt.toISOString(),
        {
          id: existing.id,
          familyId: existing.familyId,
          fullName: existing.fullName,
          phoneNumber: existing.phoneNumber,
          email: existing.email,
          notes: existing.notes,
        },
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.familyContact.update({
        where: { id: existing.id },
        data: {
          phoneNumber:
            command.payload.phoneNumber !== undefined
              ? this.asNullableString(command.payload.phoneNumber)
              : existing.phoneNumber,
          email:
            command.payload.email !== undefined
              ? this.asNullableString(command.payload.email)
              : existing.email,
          notes:
            command.payload.notes !== undefined
              ? this.asNullableString(command.payload.notes)
              : existing.notes,
        },
      });

      const serialized = {
        id: updated.id,
        familyId: updated.familyId,
        fullName: updated.fullName,
        contactType: updated.contactType,
        phoneNumber: updated.phoneNumber,
        email: updated.email,
        notes: updated.notes,
        status: updated.status,
      };
      const serverVersion = updated.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.CONTACT_UPDATED,
          after: serialized,
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: updated.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: updated.id,
        serverVersion,
        conflictCode: null,
        message: 'Contact updated.',
        serverRecord: serialized,
      };
    });
  }

  private async executeAttachReceipt(
    userId: string,
    deviceId: string,
    family: ActiveMembershipContext['family'],
    command: SyncPushCommandDto,
    payloadHash: string,
    resolvedLocalToServerId: Map<string, string>,
  ): Promise<SyncPushCommandResult> {
    const rawTxId = this.asNonEmptyString(command.payload.transactionId);
    const resolvedTxId =
      (command.dependsOnLocalId &&
        resolvedLocalToServerId.get(command.dependsOnLocalId)) ||
      (rawTxId && resolvedLocalToServerId.get(rawTxId)) ||
      rawTxId;

    const fileName = this.asNonEmptyString(command.payload.fileName);
    const fileType = this.asNonEmptyString(command.payload.fileType);
    const fileSizeBytes = Number(command.payload.fileSizeBytes ?? 0);
    const storageKey = this.asNonEmptyString(command.payload.storageKey);
    const checksumSha256 = this.asNonEmptyString(
      command.payload.checksumSha256,
    );
    const contentBase64 = this.asNullableString(command.payload.contentBase64);

    if (
      !resolvedTxId ||
      !fileName ||
      !fileType ||
      !ALLOWED_RECEIPT_MIME_TYPES.has(fileType) ||
      !Number.isInteger(fileSizeBytes) ||
      fileSizeBytes <= 0 ||
      fileSizeBytes > MAX_RECEIPT_SIZE_BYTES ||
      !storageKey ||
      !checksumSha256 ||
      !/^[a-f0-9]{64}$/i.test(checksumSha256)
    ) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'VALIDATION_FAILED',
        'Valid transactionId, allowed MIME type (JPEG/PNG/WEBP/PDF), fileSizeBytes (<= 10 MiB), storageKey, and 64-char SHA-256 checksum are required.',
      );
    }

    if (contentBase64) {
      const decoded = Buffer.from(contentBase64, 'base64');
      const actualHash = createHash('sha256').update(decoded).digest('hex');
      if (actualHash.toLowerCase() !== checksumSha256.toLowerCase()) {
        return this.recordConflictMutation(
          userId,
          deviceId,
          family.id,
          command,
          payloadHash,
          'ATTACHMENT_CHECKSUM_MISMATCH',
          'Uploaded attachment SHA-256 checksum did not match the client-recorded checksum.',
          null,
          null,
          null,
        );
      }
    }

    const parentTx = await this.prisma.familyTransaction.findFirst({
      where: { id: resolvedTxId, familyId: family.id },
    });
    if (!parentTx) {
      return this.recordRejectedMutation(
        userId,
        deviceId,
        family.id,
        command,
        payloadHash,
        'TARGET_NOT_FOUND',
        'Parent transaction for receipt was not found in this family.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.familyReceipt.create({
        data: {
          familyId: family.id,
          transactionId: parentTx.id,
          fileName,
          fileType,
          fileSizeBytes,
          storageKey,
          checksumSha256: checksumSha256.toLowerCase(),
          idempotencyKey: command.idempotencyKey,
          uploadedById: userId,
        },
      });

      const serialized = {
        id: created.id,
        familyId: created.familyId,
        transactionId: created.transactionId,
        fileName: created.fileName,
        fileType: created.fileType,
        fileSizeBytes: created.fileSizeBytes,
        storageKey: created.storageKey,
        checksumSha256: created.checksumSha256,
        uploadedById: created.uploadedById,
      };
      const serverVersion = created.updatedAt.toISOString();

      await tx.familyAuditEvent.create({
        data: {
          familyId: family.id,
          actorId: userId,
          action: FamilyAuditAction.RECEIPT_UPLOADED,
          after: serialized,
        },
      });

      await tx.familySyncMutation.create({
        data: {
          familyId: family.id,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'APPLIED',
          serverRecordId: created.id,
          responseJson: {
            serverVersion,
            serverRecord: serialized,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        outcome: 'APPLIED',
        serverRecordId: created.id,
        serverVersion,
        conflictCode: null,
        message: 'Receipt metadata verified and persisted.',
        serverRecord: serialized,
      };
    });
  }

  private async recordRejectedMutation(
    userId: string,
    deviceId: string,
    familyId: string,
    command: SyncPushCommandDto,
    payloadHash: string,
    conflictCode: SyncConflictCode,
    message: string,
  ): Promise<SyncPushCommandResult> {
    await this.prisma.$transaction(async (tx) => {
      await tx.familySyncMutation.create({
        data: {
          familyId,
          actorId: userId,
          deviceId,
          idempotencyKey: command.idempotencyKey,
          localRecordId: command.localRecordId,
          commandType: command.commandType,
          payloadHash,
          outcome: 'REJECTED',
          conflictCode,
          serverRecordId: null,
          responseJson: { message } as Prisma.InputJsonValue,
        },
      });
      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.SYNC_MUTATION_REJECTED,
          after: {
            idempotencyKey: command.idempotencyKey,
            commandType: command.commandType,
            conflictCode,
            message,
          },
        },
      });
    });

    return {
      idempotencyKey: command.idempotencyKey,
      localRecordId: command.localRecordId,
      commandType: command.commandType,
      outcome: 'REJECTED',
      serverRecordId: null,
      serverVersion: null,
      conflictCode,
      message,
      serverRecord: null,
    };
  }

  private async recordConflictMutation(
    userId: string,
    deviceId: string,
    familyId: string,
    command: SyncPushCommandDto,
    payloadHash: string,
    conflictCode: SyncConflictCode,
    message: string,
    serverRecordId: string | null,
    serverVersion: string | null,
    serverRecord: Record<string, unknown> | null,
  ): Promise<SyncPushCommandResult> {
    await this.prisma.familySyncMutation.create({
      data: {
        familyId,
        actorId: userId,
        deviceId,
        idempotencyKey: command.idempotencyKey,
        localRecordId: command.localRecordId,
        commandType: command.commandType,
        payloadHash,
        outcome: 'CONFLICT',
        conflictCode,
        serverRecordId,
        responseJson: {
          message,
          serverVersion,
          serverRecord,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      idempotencyKey: command.idempotencyKey,
      localRecordId: command.localRecordId,
      commandType: command.commandType,
      outcome: 'CONFLICT',
      serverRecordId,
      serverVersion,
      conflictCode,
      message,
      serverRecord,
    };
  }

  private async requireActiveMembership(
    userId: string,
    familyIdentifier: string,
  ): Promise<ActiveMembershipContext> {
    const family = await this.prisma.family.findFirst({
      where: {
        OR: [{ slug: familyIdentifier }, { id: familyIdentifier }],
      },
    });

    if (!family) {
      throw new NotFoundException('Family workspace not found.');
    }

    const membership = await this.prisma.familyMember.findFirst({
      where: {
        familyId: family.id,
        userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Family workspace not found.');
    }

    if (membership.removedAt !== null) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'MEMBERSHIP_REVOKED',
        message: 'Your membership in this family has been revoked.',
      });
    }

    return { family, membership };
  }

  private parseCursor(cursor?: string): Date | null {
    if (!cursor || !cursor.trim()) {
      return null;
    }

    const parts = cursor.trim().split(':');
    if (parts.length < 2 || parts[0] !== 'v1') {
      throw new BadRequestException('Invalid synchronization cursor format.');
    }

    const ms = Number.parseInt(parts[1] ?? '', 10);
    if (!Number.isFinite(ms) || ms < 0) {
      throw new BadRequestException(
        'Invalid synchronization cursor timestamp.',
      );
    }

    return new Date(ms);
  }

  private formatCursor(date: Date, lastEntityId: string): string {
    return `v1:${date.getTime()}:${lastEntityId}`;
  }

  private hashCommandPayload(command: SyncPushCommandDto): string {
    const canonical = JSON.stringify({
      commandType: command.commandType,
      localRecordId: command.localRecordId,
      dependsOnLocalId: command.dependsOnLocalId ?? null,
      baseVersion: command.baseVersion ?? null,
      payload: command.payload,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  private serializeTransactionRecord(tx: {
    id: string;
    familyId: string;
    categoryId: string;
    amountMinorUnits: bigint;
    expectedAmountMinorUnits?: bigint | null;
    currency: string;
    type: TransactionType;
    scope: TransactionScope;
    status: TransactionStatus;
    incomeRecurrence: IncomeRecurrence;
    paymentStatus: IncomePaymentStatus;
    date: Date;
    description: string | null;
    paymentMethod: string | null;
    notes: string | null;
    receivedFrom: string | null;
    receivedBy: string | null;
    createdById: string;
    approvedById: string | null;
    approvedAt: Date | null;
    reversedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    category?: { name: string; icon?: string | null; color?: string | null };
    createdBy?: { fullName: string };
  }): Record<string, unknown> {
    return {
      id: tx.id,
      familyId: tx.familyId,
      categoryId: tx.categoryId,
      categoryName: tx.category?.name ?? null,
      categoryIcon: tx.category?.icon ?? null,
      categoryColor: tx.category?.color ?? null,
      amountMinorUnits: tx.amountMinorUnits.toString(),
      expectedAmountMinorUnits:
        tx.expectedAmountMinorUnits != null
          ? tx.expectedAmountMinorUnits.toString()
          : null,
      currency: tx.currency,
      type: tx.type,
      scope: tx.scope,
      status: tx.status,
      incomeRecurrence: tx.incomeRecurrence,
      paymentStatus: tx.paymentStatus,
      date: tx.date.toISOString(),
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      notes: tx.notes,
      receivedFrom: tx.receivedFrom,
      receivedBy: tx.receivedBy,
      createdById: tx.createdById,
      createdByName: tx.createdBy?.fullName ?? null,
      approvedById: tx.approvedById,
      approvedAt: tx.approvedAt?.toISOString() ?? null,
      reversedAt: tx.reversedAt?.toISOString() ?? null,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    };
  }

  private asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private asNullableString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
