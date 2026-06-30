import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContributionPaymentStatus,
  FamilyAuthority,
  FamilyCapability,
  FamilyProjectContributionStatus,
  FamilyProjectStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { can } from '../families/family-access';
import { PrismaService } from '../prisma/prisma.service';

export type ReportPeriod = 'month' | 'quarter' | 'year';
export type ReportTypeFilter =
  | 'all'
  | 'money'
  | 'contributions'
  | 'projects'
  | 'savings'
  | 'debts'
  | 'budgets';

type DateRange = { start: Date; end: Date; label: string };

type Membership = {
  id: string;
  familyId: string;
  userId: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  family: { id: string; defaultCurrency: string };
};

// Prisma result types — inferred from the actual queries so TypeScript is happy.
type PaymentRow = Prisma.FamilyContributionPaymentGetPayload<{
  include: {
    member: { include: { user: { select: { fullName: true } } } };
    plan: { select: { name: true } };
  };
}>;

type ProjectRow = Prisma.FamilyProjectGetPayload<{
  include: {
    ownerMember: { include: { user: { select: { fullName: true } } } };
  };
}>;

type ProjectContributionRow = {
  projectId: string;
  amountMinorUnits: bigint;
  status: FamilyProjectContributionStatus;
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  month: 'This month',
  quarter: 'This quarter',
  year: 'This year',
};

/**
 * Aggregates the family reports overview from persisted records only.
 *
 * Income, expenses, savings, debt, and budget ledgers are not yet modelled;
 * their totals are returned as `null`. Only contribution payments and project
 * budgets have persisted records, so those drive the real totals.
 *
 * The VIEW_REPORTS capability is enforced server-side. Never invent totals
 * for ledgers that do not exist.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    userId: string,
    familyId: string,
    periodInput?: string,
    typeInput?: string,
  ): Promise<Record<string, unknown>> {
    const membership = await this.requireMembership(userId, familyId);

    if (!can(membership, FamilyCapability.VIEW_REPORTS)) {
      throw new ForbiddenException(
        'You do not have permission to view reports for this family.',
      );
    }

    const period = this.resolvePeriod(periodInput);
    const type = this.resolveTypeFilter(typeInput);
    const range = this.resolveRange(period);
    const now = new Date();
    const currency = membership.family.defaultCurrency;

    const includeContributions = type === 'all' || type === 'contributions';
    const includeProjects = type === 'all' || type === 'projects';

    // --- Fetch data in parallel; use typed empty arrays for skipped modules ---
    const paymentsQuery = includeContributions
      ? this.prisma.familyContributionPayment.findMany({
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
          take: 50,
        })
      : Promise.resolve([] as PaymentRow[]);

    const projectsQuery = includeProjects
      ? this.prisma.familyProject.findMany({
          where: { familyId, archivedAt: null },
          include: {
            ownerMember: {
              include: { user: { select: { fullName: true } } },
            },
          },
          orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
          take: 50,
        })
      : Promise.resolve([] as ProjectRow[]);

    const projectContributionsQuery = includeProjects
      ? this.prisma.familyProjectContribution.findMany({
          where: { familyId, reversedAt: null },
          select: {
            projectId: true,
            amountMinorUnits: true,
            status: true,
          },
        })
      : Promise.resolve([] as ProjectContributionRow[]);

    // Pending approvals count is always surfaced regardless of type filter.
    const pendingApprovalCountQuery =
      this.prisma.familyContributionPayment.count({
        where: {
          familyId,
          reversedAt: null,
          status: ContributionPaymentStatus.PENDING,
        },
      });

    const [payments, projects, projectContributions, pendingApprovalCount] =
      await Promise.all([
        paymentsQuery,
        projectsQuery,
        projectContributionsQuery,
        pendingApprovalCountQuery,
      ]);

    // --- Contribution totals ---
    const verifiedPayments = payments.filter(
      (p) => p.status === ContributionPaymentStatus.VERIFIED,
    );
    const contributionsPaid = verifiedPayments.reduce(
      (sum, p) => sum + p.amountMinorUnits,
      0n,
    );

    // --- Project totals ---
    const verifiedProjectContributions = projectContributions.filter(
      (c) => c.status === FamilyProjectContributionStatus.VERIFIED,
    );
    const contributedByProject = new Map<string, bigint>();
    for (const contrib of verifiedProjectContributions) {
      contributedByProject.set(
        contrib.projectId,
        (contributedByProject.get(contrib.projectId) ?? 0n) +
          contrib.amountMinorUnits,
      );
    }

    const projectPlanned = projects.reduce(
      (sum, p) => sum + p.targetAmountMinorUnits,
      0n,
    );
    const activeProjectCount = projects.filter(
      (p) => p.status === FamilyProjectStatus.ACTIVE,
    ).length;

    // --- Source record count and rows ---
    const sourceRecordCount = payments.length + projects.length;

    const contributionRows = payments.slice(0, 25).map((p) => ({
      id: p.id,
      module: 'contributions',
      title: `${p.plan.name} — ${p.member.user.fullName}`,
      date: p.paidAt.toISOString(),
      status: p.status.toLowerCase(),
      amountMinorUnits: p.amountMinorUnits.toString(),
      createdBy: p.member.user.fullName,
    }));

    const projectRows = projects.slice(0, 25).map((p) => ({
      id: p.id,
      module: 'projects',
      title: p.name,
      date: p.createdAt.toISOString(),
      status: p.status.toLowerCase(),
      amountMinorUnits: p.targetAmountMinorUnits.toString(),
      createdBy: p.ownerMember?.user.fullName ?? null,
    }));

    const sourceRecords = [...contributionRows, ...projectRows].slice(0, 50);

    // --- Breakdown: only modules with real data ---
    const breakdown: { label: string; amountMinorUnits: string }[] = [];
    if (contributionsPaid > 0n) {
      breakdown.push({
        label: 'Contributions',
        amountMinorUnits: contributionsPaid.toString(),
      });
    }
    if (projectPlanned > 0n) {
      breakdown.push({
        label: 'Projects (planned)',
        amountMinorUnits: projectPlanned.toString(),
      });
    }

    return {
      currency,
      generatedAt: now.toISOString(),
      sourceRecordCount,
      period: {
        label: range.label,
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      },
      totals: {
        // Ledgers not yet modelled — return null, never invent a value.
        cashBalanceMinorUnits: null,
        incomeMinorUnits: null,
        expenseMinorUnits: null,
        savingsMinorUnits: null,
        debtOutstandingMinorUnits: null,
        // Modelled ledgers.
        contributionsPaidMinorUnits: includeContributions
          ? contributionsPaid.toString()
          : null,
        projectPlannedMinorUnits: includeProjects
          ? projectPlanned.toString()
          : null,
        // Meta counts.
        activeProjectCount: includeProjects ? activeProjectCount : null,
        // Report and export tables are not yet modelled.
        reportCount: null,
        exportCount: null,
        pendingApprovalCount,
      },
      // Trend data requires income/expense records not yet modelled.
      trend: [],
      breakdown,
      // No persisted report rows yet.
      reports: [],
      sourceRecords,
      // No export table yet.
      exports: [],
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

  private resolvePeriod(input?: string): ReportPeriod {
    if (input === 'quarter' || input === 'year') return input;
    return 'month';
  }

  private resolveTypeFilter(input?: string): ReportTypeFilter {
    const valid: ReportTypeFilter[] = [
      'all',
      'money',
      'contributions',
      'projects',
      'savings',
      'debts',
      'budgets',
    ];
    if (valid.includes(input as ReportTypeFilter)) {
      return input as ReportTypeFilter;
    }
    return 'all';
  }

  private resolveRange(period: ReportPeriod): DateRange {
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
