import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContributionCycleStatus,
  ContributionPaymentStatus,
  FamilyAuthority,
  FamilyCapability,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type MoneyPeriod = 'month' | 'quarter' | 'year';

type DateRange = { start: Date; end: Date; label: string };

type Membership = {
  id: string;
  familyId: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  family: { id: string; defaultCurrency: string };
};

const PERIOD_LABELS: Record<MoneyPeriod, string> = {
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

/**
 * Aggregates the family money overview from persisted records only.
 *
 * Income, expense, savings, debt, and budget ledgers are not modelled yet, so
 * their totals are returned as `null` and their lists as empty arrays. The only
 * persisted money records today are contribution payments and cycles, so those
 * drive the contributions total, allocation, approvals, and recent records.
 * Never invent totals for ledgers that do not exist.
 */
@Injectable()
export class MoneyService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [payments, cycles, pendingApprovalCount] = await Promise.all([
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
      this.prisma.familyContributionCycle.findMany({
        where: {
          familyId,
          periodStart: { lt: range.end },
          periodEnd: { gte: range.start },
        },
        select: { status: true, dueDate: true },
      }),
      this.prisma.familyContributionPayment.count({
        where: {
          familyId,
          reversedAt: null,
          status: ContributionPaymentStatus.PENDING,
        },
      }),
    ]);

    const verifiedPayments = payments.filter(
      (payment) => payment.status === ContributionPaymentStatus.VERIFIED,
    );
    const contributionsPaid = verifiedPayments.reduce(
      (sum, payment) => sum + payment.amountMinorUnits,
      0n,
    );

    const overdueCount = cycles.filter(
      (cycle) =>
        cycle.status === ContributionCycleStatus.OVERDUE ||
        (cycle.status !== ContributionCycleStatus.COMPLETED &&
          cycle.dueDate < now),
    ).length;

    const approvals = payments
      .filter((payment) => payment.status === ContributionPaymentStatus.PENDING)
      .slice(0, 25)
      .map((payment) => ({
        id: payment.id,
        type: 'contribution_payment',
        title: `${payment.plan.name} — ${payment.member.user.fullName}`,
        amountMinorUnits: payment.amountMinorUnits.toString(),
        submittedBy: payment.member.user.fullName,
        submittedAt: payment.createdAt.toISOString(),
        status: 'pending',
      }));

    const records = payments.slice(0, 25).map((payment) => ({
      id: payment.id,
      type: 'contribution',
      title: `${payment.plan.name} — ${payment.member.user.fullName}`,
      category: payment.plan.name,
      amountMinorUnits: payment.amountMinorUnits.toString(),
      date: payment.paidAt.toISOString(),
      status: payment.status.toLowerCase(),
      createdBy: payment.member.user.fullName,
    }));

    const allocation =
      contributionsPaid > 0n
        ? [
            {
              label: 'Contributions',
              amountMinorUnits: contributionsPaid.toString(),
            },
          ]
        : [];

    return {
      currency,
      period: {
        label: range.label,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      },
      generatedAt: now.toISOString(),
      sourceRecordCount: payments.length,
      totals: {
        // No income/expense ledger yet, so a cash balance cannot be derived.
        cashBalanceMinorUnits: null,
        incomeMinorUnits: null,
        expenseMinorUnits: null,
        contributionsPaidMinorUnits: contributionsPaid.toString(),
        savingsMinorUnits: null,
        debtOutstandingMinorUnits: null,
        pendingApprovalCount,
        overdueCount,
      },
      // Cash flow needs income and expense records that are not modelled yet.
      cashFlow: [],
      allocation,
      // Budgets are not modelled yet.
      budgets: [],
      approvals,
      records,
    };
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

  private resolvePeriod(input?: string): MoneyPeriod {
    if (input === 'quarter' || input === 'year') return input;
    return 'month';
  }

  private resolveRange(period: MoneyPeriod): DateRange {
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
