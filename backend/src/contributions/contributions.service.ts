import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ContributionCycleStatus,
  ContributionPaymentStatus,
  ContributionPlanStatus,
  FamilyAuditAction,
  FamilyAuthority,
  FamilyCapability,
  NotificationType,
} from '@prisma/client';
import { can } from '../families/family-access';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCycleDto } from './dto/create-cycle.dto';
import type { CreatePlanDto } from './dto/create-plan.dto';
import type { RecordPaymentDto } from './dto/record-payment.dto';

export type ContributionPeriod = 'month' | 'quarter' | 'year';

type DateRange = { start: Date; end: Date; label: string };

type Membership = {
  id: string;
  familyId: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  family: { id: string; defaultCurrency: string };
};

const PERIOD_LABELS: Record<ContributionPeriod, string> = {
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

@Injectable()
export class ContributionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async getOverview(
    userId: string,
    familyId: string,
    periodInput?: string,
  ): Promise<Record<string, unknown>> {
    const membership = await this.requireMembership(userId, familyId);
    const period = this.resolvePeriod(periodInput);
    const range = this.resolveRange(period);
    const now = new Date();
    const currency = membership.family.defaultCurrency;

    const [members, plans, cycles, payments, pendingVerificationCount] =
      await Promise.all([
        this.prisma.familyMember.findMany({
          where: { familyId, removedAt: null },
          include: { user: { select: { fullName: true } } },
        }),
        this.prisma.familyContributionPlan.findMany({
          where: { familyId, status: { not: ContributionPlanStatus.ARCHIVED } },
          include: { assignments: { where: { removedAt: null } } },
        }),
        this.prisma.familyContributionCycle.findMany({
          where: {
            familyId,
            periodStart: { lt: range.end },
            periodEnd: { gte: range.start },
          },
          orderBy: { periodStart: 'asc' },
        }),
        this.prisma.familyContributionPayment.findMany({
          where: {
            familyId,
            reversedAt: null,
            paidAt: { gte: range.start, lt: range.end },
          },
          include: {
            member: { include: { user: { select: { fullName: true } } } },
            plan: { select: { name: true } },
          },
          orderBy: { paidAt: 'desc' },
        }),
        this.prisma.familyContributionPayment.count({
          where: {
            familyId,
            reversedAt: null,
            status: ContributionPaymentStatus.PENDING,
          },
        }),
      ]);

    const memberName = new Map(members.map((m) => [m.id, m.user.fullName]));
    const verifiedPayments = payments.filter(
      (p) => p.status === ContributionPaymentStatus.VERIFIED,
    );

    // Active assignments grouped by plan, for per-member and per-cycle expected.
    const assignmentsByPlan = new Map(
      plans.map((plan) => [plan.id, plan.assignments]),
    );

    // Per-cycle collected (verified only).
    const collectedByCycle = new Map<string, bigint>();
    const verifiedMembersByCycle = new Map<string, Set<string>>();
    for (const payment of verifiedPayments) {
      if (!payment.cycleId) continue;
      collectedByCycle.set(
        payment.cycleId,
        (collectedByCycle.get(payment.cycleId) ?? 0n) +
          payment.amountMinorUnits,
      );
      const set = verifiedMembersByCycle.get(payment.cycleId) ?? new Set();
      set.add(payment.memberId);
      verifiedMembersByCycle.set(payment.cycleId, set);
    }

    const isOverdue = (cycle: {
      status: ContributionCycleStatus;
      dueDate: Date;
    }) =>
      cycle.status === ContributionCycleStatus.OVERDUE ||
      (cycle.status !== ContributionCycleStatus.COMPLETED &&
        cycle.dueDate < now);

    // Totals.
    let expected = 0n;
    let overdue = 0n;
    const overdueContributors = new Set<string>();
    const memberExpected = new Map<string, bigint>();

    for (const cycle of cycles) {
      expected += cycle.expectedMinorUnits;
      const cycleCollected = collectedByCycle.get(cycle.id) ?? 0n;
      const planAssignments = assignmentsByPlan.get(cycle.planId) ?? [];

      for (const assignment of planAssignments) {
        memberExpected.set(
          assignment.memberId,
          (memberExpected.get(assignment.memberId) ?? 0n) +
            assignment.amountMinorUnits,
        );
      }

      if (isOverdue(cycle)) {
        const remaining = cycle.expectedMinorUnits - cycleCollected;
        if (remaining > 0n) overdue += remaining;
        const paidMembers = verifiedMembersByCycle.get(cycle.id) ?? new Set();
        for (const assignment of planAssignments) {
          if (!paidMembers.has(assignment.memberId)) {
            overdueContributors.add(assignment.memberId);
          }
        }
      }
    }

    const collected = verifiedPayments.reduce(
      (sum, p) => sum + p.amountMinorUnits,
      0n,
    );
    const outstanding = expected > collected ? expected - collected : 0n;

    const memberPaid = new Map<string, bigint>();
    const memberLastPaid = new Map<string, Date>();
    for (const payment of verifiedPayments) {
      memberPaid.set(
        payment.memberId,
        (memberPaid.get(payment.memberId) ?? 0n) + payment.amountMinorUnits,
      );
      const prev = memberLastPaid.get(payment.memberId);
      if (!prev || payment.paidAt > prev) {
        memberLastPaid.set(payment.memberId, payment.paidAt);
      }
    }

    const contributorsPaid = new Set(verifiedPayments.map((p) => p.memberId))
      .size;
    const contributorsExpected = new Set(memberExpected.keys()).size;

    // Per-plan rollups.
    const collectedByPlan = new Map<string, bigint>();
    for (const payment of verifiedPayments) {
      collectedByPlan.set(
        payment.planId,
        (collectedByPlan.get(payment.planId) ?? 0n) + payment.amountMinorUnits,
      );
    }
    const expectedByPlan = new Map<string, bigint>();
    for (const cycle of cycles) {
      expectedByPlan.set(
        cycle.planId,
        (expectedByPlan.get(cycle.planId) ?? 0n) + cycle.expectedMinorUnits,
      );
    }

    const planRows = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      cadence: plan.cadence,
      amountMinorUnits: plan.amountMinorUnits.toString(),
      collectedMinorUnits: (collectedByPlan.get(plan.id) ?? 0n).toString(),
      expectedMinorUnits: (expectedByPlan.get(plan.id) ?? 0n).toString(),
      contributorCount: plan.assignments.length,
      status: plan.status,
    }));

    const memberIds = new Set<string>([
      ...memberExpected.keys(),
      ...memberPaid.keys(),
    ]);
    const memberRows = [...memberIds].map((id) => {
      const exp = memberExpected.get(id) ?? 0n;
      const paid = memberPaid.get(id) ?? 0n;
      const out = exp > paid ? exp - paid : 0n;
      const status = this.resolveMemberStatus(
        exp,
        paid,
        out,
        overdueContributors.has(id),
      );
      return {
        id,
        fullName: memberName.get(id) ?? 'Unknown member',
        expectedMinorUnits: exp.toString(),
        paidMinorUnits: paid.toString(),
        outstandingMinorUnits: out.toString(),
        lastPaymentDate: memberLastPaid.get(id)?.toISOString() ?? null,
        status,
      };
    });

    const cycleRows = cycles.map((cycle) => {
      const cycleCollected = collectedByCycle.get(cycle.id) ?? 0n;
      const exp = cycle.expectedMinorUnits;
      return {
        id: cycle.id,
        label: cycle.label,
        dueDate: cycle.dueDate.toISOString(),
        collectedMinorUnits: cycleCollected.toString(),
        expectedMinorUnits: exp.toString(),
        percentCollected: this.percent(cycleCollected, exp) ?? 0,
        status: isOverdue(cycle)
          ? ContributionCycleStatus.OVERDUE
          : cycle.status,
      };
    });

    const trend = cycles.map((cycle) => ({
      label: cycle.label,
      collectedMinorUnits: (collectedByCycle.get(cycle.id) ?? 0n).toString(),
      expectedMinorUnits: cycle.expectedMinorUnits.toString(),
    }));

    const statusBreakdown = [
      { label: 'Collected', amountMinorUnits: collected.toString() },
      { label: 'Outstanding', amountMinorUnits: outstanding.toString() },
      ...(overdue > 0n
        ? [{ label: 'Overdue', amountMinorUnits: overdue.toString() }]
        : []),
    ];

    const paymentRows = payments.slice(0, 25).map((payment) => ({
      id: payment.id,
      contributor: payment.member.user.fullName,
      planName: payment.plan.name,
      method: payment.method,
      amountMinorUnits: payment.amountMinorUnits.toString(),
      date: payment.paidAt.toISOString(),
      status: payment.status,
    }));

    return {
      currency,
      period: {
        label: range.label,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      },
      generatedAt: now.toISOString(),
      sourceRecordCount: plans.length + cycles.length + payments.length,
      totals: {
        expectedMinorUnits: expected.toString(),
        collectedMinorUnits: collected.toString(),
        outstandingMinorUnits: outstanding.toString(),
        overdueMinorUnits: overdue.toString(),
        collectionRatePercent: this.percent(collected, expected),
        contributorsPaid,
        contributorsExpected,
        activePlanCount: plans.filter(
          (p) => p.status === ContributionPlanStatus.ACTIVE,
        ).length,
        pendingVerificationCount,
        overdueContributorCount: overdueContributors.size,
      },
      trend,
      statusBreakdown,
      plans: planRows,
      cycles: cycleRows,
      members: memberRows,
      payments: paymentRows,
    };
  }

  async createPlan(userId: string, familyId: string, dto: CreatePlanDto) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireCapability(membership, FamilyCapability.MANAGE_CONTRIBUTIONS);

    const amount = BigInt(dto.amountMinorUnits);
    const assignments = dto.assignments ?? [];
    if (assignments.length > 0) {
      await this.assertMembersBelong(
        familyId,
        assignments.map((a) => a.memberId),
      );
    }

    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyContributionPlan.create({
        data: {
          familyId,
          name: dto.name,
          description: dto.description || null,
          cadence: dto.cadence,
          amountMinorUnits: amount,
          currency: dto.currency ?? membership.family.defaultCurrency,
          createdById: userId,
          assignments: {
            create: assignments.map((a) => ({
              memberId: a.memberId,
              amountMinorUnits: a.amountMinorUnits
                ? BigInt(a.amountMinorUnits)
                : amount,
            })),
          },
        },
        include: { assignments: true },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTRIBUTION_PLAN_CREATED,
          after: {
            planId: created.id,
            name: created.name,
            cadence: created.cadence,
            amountMinorUnits: created.amountMinorUnits.toString(),
            assignmentCount: created.assignments.length,
          },
        },
      });

      return created;
    });

    return {
      id: plan.id,
      name: plan.name,
      cadence: plan.cadence,
      amountMinorUnits: plan.amountMinorUnits.toString(),
      currency: plan.currency,
      status: plan.status,
      assignmentCount: plan.assignments.length,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  async createCycle(userId: string, familyId: string, dto: CreateCycleDto) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireCapability(membership, FamilyCapability.MANAGE_CONTRIBUTIONS);

    const plan = await this.prisma.familyContributionPlan.findFirst({
      where: { id: dto.planId, familyId },
      include: { assignments: { where: { removedAt: null } } },
    });
    if (!plan) {
      throw new NotFoundException('Contribution plan not found.');
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    const dueDate = new Date(dto.dueDate);
    if (periodEnd < periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart.');
    }

    const expected = plan.assignments.reduce(
      (sum, a) => sum + a.amountMinorUnits,
      0n,
    );

    const cycle = await this.prisma.familyContributionCycle.create({
      data: {
        familyId,
        planId: plan.id,
        label: dto.label,
        periodStart,
        periodEnd,
        dueDate,
        expectedMinorUnits: expected,
      },
    });

    return {
      id: cycle.id,
      planId: cycle.planId,
      label: cycle.label,
      expectedMinorUnits: cycle.expectedMinorUnits.toString(),
      status: cycle.status,
      dueDate: cycle.dueDate.toISOString(),
    };
  }

  async recordPayment(
    userId: string,
    familyId: string,
    dto: RecordPaymentDto,
    idempotencyKey?: string,
  ) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireCapability(membership, FamilyCapability.MANAGE_CONTRIBUTIONS);

    if (idempotencyKey) {
      const existing = await this.prisma.familyContributionPayment.findUnique({
        where: { familyId_idempotencyKey: { familyId, idempotencyKey } },
      });
      if (existing) {
        return this.toPaymentResponse(existing);
      }
    }

    const plan = await this.prisma.familyContributionPlan.findFirst({
      where: { id: dto.planId, familyId },
      select: { id: true },
    });
    if (!plan) {
      throw new NotFoundException('Contribution plan not found.');
    }

    await this.assertMembersBelong(familyId, [dto.memberId]);

    if (dto.cycleId) {
      const cycle = await this.prisma.familyContributionCycle.findFirst({
        where: { id: dto.cycleId, familyId, planId: dto.planId },
        select: { id: true },
      });
      if (!cycle) {
        throw new NotFoundException('Contribution cycle not found.');
      }
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.familyContributionPayment.create({
        data: {
          familyId,
          planId: dto.planId,
          cycleId: dto.cycleId ?? null,
          memberId: dto.memberId,
          amountMinorUnits: BigInt(dto.amountMinorUnits),
          method: dto.method,
          reference: dto.reference || null,
          note: dto.note || null,
          idempotencyKey: idempotencyKey ?? null,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          recordedById: userId,
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTRIBUTION_RECORDED,
          targetMemberId: dto.memberId,
          after: {
            paymentId: created.id,
            planId: created.planId,
            cycleId: created.cycleId,
            amountMinorUnits: created.amountMinorUnits.toString(),
            method: created.method,
          },
        },
      });

      return created;
    });

    return this.toPaymentResponse(payment);
  }

  async verifyPayment(userId: string, familyId: string, paymentId: string) {
    const membership = await this.requireMembership(userId, familyId);
    this.requireCapability(membership, FamilyCapability.MANAGE_CONTRIBUTIONS);

    const payment = await this.prisma.familyContributionPayment.findFirst({
      where: { id: paymentId, familyId, reversedAt: null },
    });
    if (!payment) {
      throw new NotFoundException('Contribution payment not found.');
    }
    if (payment.status === ContributionPaymentStatus.VERIFIED) {
      return this.toPaymentResponse(payment);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.familyContributionPayment.update({
        where: { id: paymentId },
        data: {
          status: ContributionPaymentStatus.VERIFIED,
          verifiedById: userId,
          verifiedAt: new Date(),
        },
      });

      await tx.familyAuditEvent.create({
        data: {
          familyId,
          actorId: userId,
          action: FamilyAuditAction.CONTRIBUTION_VERIFIED,
          targetMemberId: row.memberId,
          before: { status: payment.status },
          after: {
            paymentId: row.id,
            status: row.status,
            amountMinorUnits: row.amountMinorUnits.toString(),
          },
        },
      });

      if (this.notificationsService) {
        const member = await tx.familyMember.findUnique({
          where: { id: row.memberId },
          select: { userId: true },
        });

        if (member && member.userId !== userId) {
          const family = await tx.family.findUnique({
            where: { id: familyId },
            select: { slug: true },
          });
          const familySlug = encodeURIComponent(family?.slug ?? familyId);
          await this.notificationsService.createNotification(
            {
              userId: member.userId,
              familyId,
              type: NotificationType.CONTRIBUTION_VERIFIED,
              title: 'Contribution Verified',
              description: 'Your contribution payment has been verified.',
              href: `/family/${familySlug}/money`,
              dedupeKey: `contrib-verify:${row.id}`,
            },
            tx,
          );
        }
      }

      return row;
    });

    return this.toPaymentResponse(updated);
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
      throw new ForbiddenException('You cannot manage family contributions.');
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

  private toPaymentResponse(payment: {
    id: string;
    planId: string;
    cycleId: string | null;
    memberId: string;
    amountMinorUnits: bigint;
    method: string;
    status: string;
    paidAt: Date;
  }) {
    return {
      id: payment.id,
      planId: payment.planId,
      cycleId: payment.cycleId,
      memberId: payment.memberId,
      amountMinorUnits: payment.amountMinorUnits.toString(),
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt.toISOString(),
    };
  }

  private resolveMemberStatus(
    expected: bigint,
    paid: bigint,
    outstanding: bigint,
    hasOverdue: boolean,
  ): string {
    if (expected <= 0n && paid > 0n) return 'paid';
    if (paid <= 0n) return hasOverdue ? 'overdue' : 'pending';
    if (outstanding <= 0n) return 'paid';
    return hasOverdue ? 'overdue' : 'partial';
  }

  private percent(numerator: bigint, denominator: bigint): number | null {
    if (denominator <= 0n) return null;
    return (Number(numerator) / Number(denominator)) * 100;
  }

  private resolvePeriod(input?: string): ContributionPeriod {
    if (input === 'quarter' || input === 'year') return input;
    return 'month';
  }

  private resolveRange(period: ContributionPeriod): DateRange {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const end = new Date(now.getTime());
    let start: Date;

    if (period === 'year') {
      start = new Date(Date.UTC(year, 0, 1));
    } else if (period === 'quarter') {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start = new Date(Date.UTC(year, quarterStartMonth, 1));
    } else {
      start = new Date(Date.UTC(year, month, 1));
    }

    return { start, end, label: PERIOD_LABELS[period] };
  }
}
