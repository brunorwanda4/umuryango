import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  FamilyProjectContributionStatus,
  FamilyProjectStatus,
  type FamilyProject,
} from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';

type ProjectStatusFilter = 'active' | 'planned' | 'completed' | 'all';

type Membership = {
  id: string;
  familyId: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  family: { id: string; defaultCurrency: string };
};

type ProjectWithRelations = FamilyProject & {
  ownerMember: { user: { fullName: string } } | null;
  participants: { id: string }[];
};

const STATUS_FILTERS: Record<
  Exclude<ProjectStatusFilter, 'all'>,
  FamilyProjectStatus
> = {
  active: FamilyProjectStatus.ACTIVE,
  planned: FamilyProjectStatus.PLANNED,
  completed: FamilyProjectStatus.COMPLETED,
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    userId: string,
    familyId: string,
    statusInput?: string,
  ): Promise<Record<string, unknown>> {
    const membership = await this.requireMembership(userId, familyId);
    const status = this.resolveStatusFilter(statusInput);
    const now = new Date();
    const currency = membership.family.defaultCurrency;
    const projectWhere = {
      familyId,
      archivedAt: null,
      ...(status === 'all' ? {} : { status: STATUS_FILTERS[status] }),
    };

    const [projects, updates] = await Promise.all([
      this.prisma.familyProject.findMany({
        where: projectWhere,
        include: {
          ownerMember: { include: { user: { select: { fullName: true } } } },
          participants: { where: { removedAt: null }, select: { id: true } },
        },
        orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      }),
      this.prisma.familyProjectUpdate.findMany({
        where: {
          familyId,
          project: projectWhere,
        },
        include: {
          project: { select: { name: true } },
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const projectIds = projects.map((project) => project.id);
    const contributions = projectIds.length
      ? await this.prisma.familyProjectContribution.findMany({
          where: {
            familyId,
            projectId: { in: projectIds },
            reversedAt: null,
          },
          include: {
            project: { select: { name: true } },
            member: { include: { user: { select: { fullName: true } } } },
          },
          orderBy: { paidAt: 'desc' },
          take: 100,
        })
      : [];

    const verifiedContributions = contributions.filter(
      (contribution) =>
        contribution.status === FamilyProjectContributionStatus.VERIFIED,
    );
    const contributedByProject = new Map<string, bigint>();
    const contributors = new Set<string>();
    for (const contribution of verifiedContributions) {
      contributedByProject.set(
        contribution.projectId,
        (contributedByProject.get(contribution.projectId) ?? 0n) +
          contribution.amountMinorUnits,
      );
      contributors.add(contribution.memberId);
    }

    const planned = projects.reduce(
      (sum, project) => sum + project.targetAmountMinorUnits,
      0n,
    );
    const contributed = verifiedContributions.reduce(
      (sum, contribution) => sum + contribution.amountMinorUnits,
      0n,
    );
    const outstanding = projects.reduce((sum, project) => {
      const projectContributed = contributedByProject.get(project.id) ?? 0n;
      const remaining = project.targetAmountMinorUnits - projectContributed;
      return remaining > 0n ? sum + remaining : sum;
    }, 0n);

    return {
      currency,
      generatedAt: now.toISOString(),
      sourceRecordCount:
        projects.length + contributions.length + updates.length,
      totals: {
        plannedMinorUnits: planned.toString(),
        contributedMinorUnits: contributed.toString(),
        outstandingMinorUnits: outstanding.toString(),
        activeProjectCount: projects.filter(
          (project) => project.status === FamilyProjectStatus.ACTIVE,
        ).length,
        overdueProjectCount: projects.filter((project) =>
          this.isOverdue(project, now),
        ).length,
        contributorCount: contributors.size,
      },
      projects: projects.map((project) =>
        this.toProjectRow(project, contributedByProject.get(project.id) ?? 0n),
      ),
      contributions: contributions.slice(0, 25).map((contribution) => ({
        id: contribution.id,
        projectName: contribution.project.name,
        contributorName: contribution.member.user.fullName,
        amountMinorUnits: contribution.amountMinorUnits.toString(),
        paidAt: contribution.paidAt.toISOString(),
        status: contribution.status.toLowerCase(),
      })),
      updates: updates.map((update) => ({
        id: update.id,
        projectName: update.project.name,
        title: update.title,
        body: update.body,
        createdAt: update.createdAt.toISOString(),
        createdBy: update.createdBy.fullName,
      })),
    };
  }

  async create(
    userId: string,
    familyId: string,
    dto: CreateProjectDto,
    idempotencyKey?: string,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireCapability(membership, FamilyCapability.MANAGE_PROJECTS);

    if (idempotencyKey) {
      const existing = await this.prisma.familyProject.findUnique({
        where: { familyId_idempotencyKey: { familyId, idempotencyKey } },
      });
      if (existing) {
        return this.toCreateResponse(existing);
      }
    }

    if (dto.ownerMemberId) {
      await this.assertMembersBelong(familyId, [dto.ownerMemberId]);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const targetDate = new Date(dto.targetDate);
    if (startDate && targetDate < startDate) {
      throw new BadRequestException('targetDate must be after startDate.');
    }

    const status =
      startDate && startDate > new Date()
        ? FamilyProjectStatus.PLANNED
        : FamilyProjectStatus.ACTIVE;

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyProject.create({
        data: {
          familyId,
          name: dto.name,
          category: dto.category,
          description: dto.description || null,
          targetAmountMinorUnits: BigInt(dto.targetAmountMinorUnits),
          currency: dto.currency ?? membership.family.defaultCurrency,
          startDate,
          targetDate,
          status,
          ownerMemberId: dto.ownerMemberId || null,
          contributionStrategy: dto.contributionStrategy,
          expectedContributionMinorUnits: dto.expectedContributionMinorUnits
            ? BigInt(dto.expectedContributionMinorUnits)
            : null,
          participantNotes: dto.participantNotes || null,
          idempotencyKey: idempotencyKey ?? null,
          createdById: userId,
          participants: dto.ownerMemberId
            ? {
                create: {
                  memberId: dto.ownerMemberId,
                  roleNotes: dto.participantNotes || null,
                },
              }
            : undefined,
        },
        include: { participants: true },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.PROJECT_CREATED,
          targetMemberId: dto.ownerMemberId || null,
          after: {
            projectId: created.id,
            name: created.name,
            category: created.category,
            targetAmountMinorUnits: created.targetAmountMinorUnits.toString(),
            currency: created.currency,
            ownerMemberId: created.ownerMemberId,
            contributionStrategy: created.contributionStrategy,
          },
        },
      });

      return created;
    });

    return this.toCreateResponse(project);
  }

  private async requireMembership(
    userId: string,
    familyId: string,
  ): Promise<Membership> {
    const membership = await this.prisma.familyMember.findFirst({
      where: { familyId, userId, removedAt: null },
      include: { family: { select: { id: true, defaultCurrency: true } } },
    });

    if (!membership) {
      throw new NotFoundException('Family not found.');
    }

    return membership;
  }

  private requireCapability(
    membership: Membership,
    capability: FamilyCapability,
  ): void {
    if (!can(membership, capability)) {
      throw new ForbiddenException('You cannot manage family projects.');
    }
  }

  private async assertMembersBelong(
    familyId: string,
    memberIds: string[],
  ): Promise<void> {
    const unique = [...new Set(memberIds)];
    const count = await this.prisma.familyMember.count({
      where: { familyId, removedAt: null, id: { in: unique } },
    });
    if (count !== unique.length) {
      throw new BadRequestException(
        'One or more members do not belong to this family.',
      );
    }
  }

  private toProjectRow(project: ProjectWithRelations, contributed: bigint) {
    const outstanding =
      project.targetAmountMinorUnits > contributed
        ? project.targetAmountMinorUnits - contributed
        : 0n;

    return {
      id: project.id,
      name: project.name,
      category: project.category.toLowerCase(),
      description: project.description,
      targetAmountMinorUnits: project.targetAmountMinorUnits.toString(),
      contributedMinorUnits: contributed.toString(),
      outstandingMinorUnits: outstanding.toString(),
      percentFunded: this.percent(contributed, project.targetAmountMinorUnits),
      startDate: project.startDate?.toISOString() ?? null,
      targetDate: project.targetDate.toISOString(),
      status: project.status.toLowerCase(),
      ownerName: project.ownerMember?.user.fullName ?? null,
      memberCount: project.participants.length,
      contributionStrategy: project.contributionStrategy.toLowerCase(),
    };
  }

  private toCreateResponse(project: {
    id: string;
    name: string;
    category: string;
    targetAmountMinorUnits: bigint;
    currency: string;
    startDate: Date | null;
    targetDate: Date;
    status: string;
    ownerMemberId: string | null;
    contributionStrategy: string;
    expectedContributionMinorUnits: bigint | null;
    participantNotes: string | null;
    description: string | null;
    createdAt: Date;
  }) {
    return {
      id: project.id,
      name: project.name,
      category: project.category.toLowerCase(),
      targetAmountMinorUnits: project.targetAmountMinorUnits.toString(),
      currency: project.currency,
      startDate: project.startDate?.toISOString() ?? null,
      targetDate: project.targetDate.toISOString(),
      status: project.status.toLowerCase(),
      ownerMemberId: project.ownerMemberId,
      contributionStrategy: project.contributionStrategy.toLowerCase(),
      expectedContributionMinorUnits:
        project.expectedContributionMinorUnits?.toString() ?? null,
      participantNotes: project.participantNotes,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
    };
  }

  private resolveStatusFilter(input?: string): ProjectStatusFilter {
    if (input === 'planned' || input === 'completed' || input === 'all') {
      return input;
    }

    return 'active';
  }

  private isOverdue(project: FamilyProject, now: Date): boolean {
    return (
      project.targetDate < now &&
      project.status !== FamilyProjectStatus.COMPLETED &&
      project.status !== FamilyProjectStatus.CANCELLED
    );
  }

  private percent(numerator: bigint, denominator: bigint): number | null {
    if (denominator <= 0n) return null;
    return (Number(numerator) / Number(denominator)) * 100;
  }
}
