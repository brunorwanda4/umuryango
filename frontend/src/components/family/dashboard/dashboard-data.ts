import {
  BadgeDollarSignIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ReceiptTextIcon,
  TargetIcon,
} from "lucide-react";
import {
  isLoanOverdue,
  normalizeLoanRecords,
} from "@/components/family/money/loans/loan-utils";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import type { MoneyOverview } from "@/components/family/money/types";
import {
  formatMinorUnits,
  formatTitle,
  normalizeMinorUnitString,
  normalizeMoneyOverview,
} from "@/components/family/money/utils";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { normalizeProjectsOverview } from "@/components/family/projects/utils";
import { createTranslator } from "@/i18n/translate";
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
import type {
  ContributionsOverview,
  DashboardModule,
  FamilyActivityEntry,
  FamilyAttentionItem,
  FamilyAuditEvent,
  FamilyDashboardData,
  FamilyDetail,
  FamilyLoanSummary,
  FamilyMemberSummary,
  FamilyQuickActionItem,
  RejectedTransactionRow,
} from "./types";

const t = createTranslator("FamilyDashboard");

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    title: "Money",
    description: "Income and expenses",
    helperText: "Record what came in and what was spent.",
    segment: "money",
    icon: BadgeDollarSignIcon,
    requiredCapabilities: ["RECORD_INCOME", "RECORD_EXPENSE"],
  },
  {
    title: "Contributions",
    description: "Family payments",
    helperText: "Follow monthly and special support payments.",
    segment: "contributions",
    icon: HandCoinsIcon,
    requiredCapabilities: ["MANAGE_CONTRIBUTIONS"],
  },
  {
    title: "Savings",
    description: "Goals and milestones",
    helperText: "Track money saved for family goals.",
    segment: "savings",
    icon: TargetIcon,
    requiredCapabilities: ["MANAGE_SAVINGS"],
  },
  {
    title: "Debts",
    description: "Borrowed and lent",
    helperText: "See who owes money and what is due.",
    segment: "debts",
    icon: LandmarkIcon,
    requiredCapabilities: ["MANAGE_DEBTS"],
  },
  {
    title: "Projects",
    description: "Work and budgets",
    helperText: "Manage family projects, timelines, and costs.",
    segment: "projects",
    icon: FolderKanbanIcon,
    requiredCapabilities: ["MANAGE_PROJECTS"],
  },
  {
    title: "Events",
    description: "Dates and attendance",
    helperText: "Plan meetings, ceremonies, and reminders.",
    segment: "events",
    icon: CalendarDaysIcon,
    requiredCapabilities: ["MANAGE_EVENTS"],
  },
  {
    title: "Reports",
    description: "Trusted summaries",
    helperText: "Open reports generated from saved records.",
    segment: "reports",
    icon: ReceiptTextIcon,
    requiredCapabilities: ["VIEW_REPORTS"],
  },
];

export const joinedDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

const authorityOrder: FamilyAuthority[] = ["HEAD", "ADMIN", "MEMBER"];

export function getInitials(value: string) {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FM"
  );
}

export function getKinshipLabel(member: FamilyMemberSummary) {
  if (!member.kinshipLabel) {
    return t((m) => m.FamilyDashboard.kinshipNotSpecified);
  }

  if (member.kinshipLabel === "OTHER" && member.kinshipCustom) {
    return member.kinshipCustom;
  }

  return KINSHIP_LABELS[member.kinshipLabel];
}

export function getVisibleMembers(family: FamilyDetail) {
  return family.members
    .toSorted(
      (first, second) =>
        new Date(second.joinedAt).getTime() -
        new Date(first.joinedAt).getTime(),
    )
    .slice(0, 6);
}

export function getAuthorityBreakdown(family: FamilyDetail) {
  const counts = new Map<FamilyAuthority, number>(
    authorityOrder.map((authority) => [authority, 0]),
  );

  for (const member of family.members) {
    counts.set(member.authority, (counts.get(member.authority) ?? 0) + 1);
  }

  return authorityOrder.map((authority) => ({
    authority,
    label: AUTHORITY_LABELS[authority],
    members: counts.get(authority) ?? 0,
  }));
}

export function getMemberGrowth(family: FamilyDetail) {
  const joinedMonths = family.members
    .map((member) => new Date(member.joinedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => first.getTime() - second.getTime());

  let total = 0;
  const totals = new Map<string, { label: string; total: number }>();

  for (const joinedDate of joinedMonths) {
    total += 1;
    const key = `${joinedDate.getFullYear()}-${joinedDate.getMonth()}`;
    totals.set(key, {
      label: monthFormatter.format(joinedDate),
      total,
    });
  }

  return Array.from(totals.values());
}

export function getMembersJoinedThisMonth(family: FamilyDetail) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return family.members.filter((member) => {
    const joinedAt = new Date(member.joinedAt);

    return (
      !Number.isNaN(joinedAt.getTime()) &&
      joinedAt.getMonth() === currentMonth &&
      joinedAt.getFullYear() === currentYear
    );
  }).length;
}

export function getLatestFamilyActivityDate(family: FamilyDetail) {
  const dates = [
    new Date(family.createdAt),
    ...family.members.map((member) => new Date(member.joinedAt)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  if (!dates.length) {
    return null;
  }

  return dates.reduce((latest, date) =>
    date.getTime() > latest.getTime() ? date : latest,
  );
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return t((m) => m.FamilyDashboard.justNow);
  if (diffMinutes < 60)
    return t((m) => m.FamilyDashboard.minutesAgo, { minutes: diffMinutes });
  if (diffHours < 24)
    return t((m) => m.FamilyDashboard.hoursAgo, { hours: diffHours });
  if (diffDays < 7)
    return t((m) => m.FamilyDashboard.daysAgo, { days: diffDays });
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  return `${diffYears}y ago`;
}

export function canOpenModule(family: FamilyDetail, module: DashboardModule) {
  if (module.segment !== "reports" || !module.requiredCapabilities?.length) {
    return true;
  }

  return module.requiredCapabilities.some((capability) =>
    hasCapability(family, capability),
  );
}

export function getFamilyReadiness(family: FamilyDetail) {
  const checks = [
    {
      label: "Family profile",
      complete: Boolean(family.name && family.country),
    },
    { label: "Currency selected", complete: Boolean(family.defaultCurrency) },
    {
      label: "Contribution plan",
      complete: Boolean(family.contributionCadence),
    },
    { label: "Members added", complete: family.memberCount > 1 },
  ];

  const completed = checks.filter((check) => check.complete).length;

  return {
    checks,
    completed,
    percent: Math.round((completed / checks.length) * 100),
  };
}

export function getFirstName(fullName?: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}

/**
 * Resolves the authenticated member within the family workspace.
 * Never matches by `member.authority === family.authority` because multiple
 * members can share the same authority.
 */
export function resolveCurrentFamilyMember(
  family: FamilyDetail,
  currentUserId?: string | null,
  currentUserFullName?: string | null,
): {
  currentMember: FamilyMemberSummary | null;
  firstName: string | null;
} {
  if (family.currentMember) {
    const matchedFromList =
      family.members.find(
        (member) =>
          member.id === family.currentMember?.id ||
          member.userId === family.currentMember?.userId,
      ) ?? family.currentMember;

    return {
      currentMember: matchedFromList,
      firstName: getFirstName(matchedFromList.fullName),
    };
  }

  if (currentUserId) {
    const matchedByUserId =
      family.members.find((member) => member.userId === currentUserId) ?? null;
    if (matchedByUserId) {
      return {
        currentMember: matchedByUserId,
        firstName: getFirstName(matchedByUserId.fullName),
      };
    }
  }

  return {
    currentMember: null,
    firstName: getFirstName(currentUserFullName),
  };
}

/**
 * Returns permission-aware quick actions for the family dashboard.
 * Only includes routes that exist in the frontend app router.
 */
export function getFamilyQuickActions(
  family: Pick<FamilyDetail, "slug" | "authority" | "capabilities">,
): FamilyQuickActionItem[] {
  const basePath = `/family/${encodeURIComponent(family.slug)}`;
  const candidateActions: FamilyQuickActionItem[] = [
    {
      id: "add-income",
      capability: "RECORD_INCOME",
      href: `${basePath}/money/income`,
    },
    {
      id: "add-expense",
      capability: "RECORD_EXPENSE",
      href: `${basePath}/money/expenses`,
    },
    {
      id: "add-loan",
      capability: "MANAGE_DEBTS",
      href: `${basePath}/money/loans`,
    },
    {
      id: "create-project",
      capability: "MANAGE_PROJECTS",
      href: `${basePath}/projects`,
    },
    {
      id: "invite-member",
      capability: "MANAGE_MEMBERS",
      href: `${basePath}/members`,
    },
    {
      id: "review-approvals",
      capability: "APPROVE_EXPENSE",
      href: `${basePath}/money/approvals`,
    },
    {
      id: "open-reports",
      capability: "VIEW_REPORTS",
      href: `${basePath}/reports`,
    },
  ];

  return candidateActions.filter((action) =>
    hasCapability(family, action.capability),
  );
}

export function toBigIntMinorUnits(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  const normalized = normalizeMinorUnitString(
    value as string | number | null | undefined,
  );
  if (!normalized) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

function daysFromToday(dateText: string, now = new Date()): number | null {
  const dateOnly = dateText.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const todayText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const target = new Date(`${dateOnly}T00:00:00`);
  const today = new Date(`${todayText}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Summarizes persisted family loan records using bigint minor units only.
 */
export function summarizeFamilyLoans(
  loans: LoanRecord[],
  now = new Date(),
): FamilyLoanSummary {
  let borrowedMinorUnits = 0n;
  let lentMinorUnits = 0n;
  let remainingMinorUnits = 0n;
  let overdueCount = 0;
  let dueSoonCount = 0;

  const nonCancelled = loans.filter((loan) => loan.status !== "CANCELLED");

  for (const loan of nonCancelled) {
    const original = toBigIntMinorUnits(loan.originalAmountMinorUnits);
    const remaining = toBigIntMinorUnits(loan.remainingBalanceMinorUnits);
    const isCompleted = loan.status === "COMPLETED" || remaining <= 0n;

    if (loan.type === "MONEY_BORROWED") {
      borrowedMinorUnits += original;
    } else {
      lentMinorUnits += original;
    }

    if (!isCompleted) {
      remainingMinorUnits += remaining;

      if (isLoanOverdue(loan, now)) {
        overdueCount += 1;
      }

      if (loan.dueDate) {
        const diffDays = daysFromToday(loan.dueDate, now);
        if (diffDays !== null && diffDays >= 0 && diffDays <= 7) {
          dueSoonCount += 1;
        }
      }
    }
  }

  const openLoans = nonCancelled.filter(
    (loan) =>
      loan.status !== "COMPLETED" &&
      toBigIntMinorUnits(loan.remainingBalanceMinorUnits) > 0n,
  );

  const urgentLoans = [...openLoans]
    .sort((left, right) => {
      const leftOverdue = isLoanOverdue(left, now);
      const rightOverdue = isLoanOverdue(right, now);
      if (leftOverdue && !rightOverdue) return -1;
      if (rightOverdue && !leftOverdue) return 1;
      const leftDate = left.dueDate?.slice(0, 10) ?? "9999-12-31";
      const rightDate = right.dueDate?.slice(0, 10) ?? "9999-12-31";
      return leftDate.localeCompare(rightDate);
    })
    .slice(0, 3);

  return {
    borrowedMinorUnits,
    lentMinorUnits,
    remainingMinorUnits,
    overdueCount,
    dueSoonCount,
    activeCount: openLoans.length,
    urgentLoans,
  };
}

export function buildAttentionItems({
  family,
  currentMember,
  money,
  contributions,
  rejectedTransactions,
}: {
  family: Pick<
    FamilyDetail,
    "slug" | "defaultCurrency" | "authority" | "capabilities"
  >;
  currentMember: FamilyMemberSummary | null;
  money: MoneyOverview | null;
  contributions: ContributionsOverview | null;
  rejectedTransactions?: RejectedTransactionRow[] | null;
}): FamilyAttentionItem[] {
  const canApproveExpense = hasCapability(family, "APPROVE_EXPENSE");
  const canManageContributions = hasCapability(family, "MANAGE_CONTRIBUTIONS");
  const encodedSlug = encodeURIComponent(family.slug);
  const approvalsHref = canApproveExpense
    ? `/family/${encodedSlug}/money/approvals`
    : `/family/${encodedSlug}/money`;
  const currency = money?.currency ?? family.defaultCurrency;
  const items: FamilyAttentionItem[] = [];
  const seenIds = new Set<string>();

  for (const approval of money?.approvals ?? []) {
    const submittedBy = approval.submittedBy ?? "";
    const isOwnRecord =
      currentMember !== null &&
      submittedBy.trim().toLowerCase() ===
        currentMember.fullName.trim().toLowerCase();
    if (!canApproveExpense && !isOwnRecord) continue;

    seenIds.add(approval.id);
    items.push({
      id: `approval-${approval.id}`,
      kind:
        approval.type === "contribution_payment"
          ? "awaiting-verification"
          : "pending-approval",
      title: approval.title,
      subtitle: submittedBy
        ? t((m) => m.FamilyDashboard.submittedBy, { name: submittedBy })
        : t((m) => m.FamilyDashboard.pendingReview),
      date: approval.submittedAt ?? "",
      amountMinorUnits: approval.amountMinorUnits ?? "0",
      currency,
      href: approvalsHref,
    });
  }

  for (const record of money?.records ?? []) {
    const statusUpper = (record.status ?? "").toUpperCase();
    if (statusUpper !== "OVERDUE" && statusUpper !== "REJECTED") continue;
    if (seenIds.has(record.id)) continue;

    const createdBy = record.createdBy ?? "";
    const isOwnRecord =
      currentMember !== null &&
      createdBy.trim().toLowerCase() ===
        currentMember.fullName.trim().toLowerCase();
    if (!canApproveExpense && !isOwnRecord) continue;

    seenIds.add(record.id);
    items.push({
      id: `record-${record.id}`,
      kind: statusUpper === "OVERDUE" ? "overdue-record" : "rejected-record",
      title: record.title,
      subtitle: `${record.category ?? formatTitle(record.title)}${createdBy ? ` · ${createdBy}` : ""}`,
      date: record.date ?? "",
      amountMinorUnits: record.amountMinorUnits ?? "0",
      currency,
      href: `/family/${encodedSlug}/money`,
    });
  }

  for (const tx of rejectedTransactions ?? []) {
    if (seenIds.has(tx.id)) continue;
    const statusUpper = (tx.status ?? "").toUpperCase();
    if (statusUpper && statusUpper !== "REJECTED") continue;

    const creatorName = tx.createdBy?.fullName ?? "";
    const isOwnRecord =
      currentMember !== null &&
      (tx.createdById === currentMember.userId ||
        creatorName.trim().toLowerCase() ===
          currentMember.fullName.trim().toLowerCase());
    if (!canApproveExpense && !isOwnRecord) continue;

    seenIds.add(tx.id);
    const categoryName = tx.category?.name ?? "";
    const title = tx.description || categoryName || t((m) => m.Common.details);
    items.push({
      id: `rejected-${tx.id}`,
      kind: "rejected-record",
      title,
      subtitle: `${categoryName || formatTitle(tx.type ?? "Expense")}${creatorName ? ` · ${creatorName}` : ""}`,
      date: tx.date ?? "",
      amountMinorUnits: tx.amountMinorUnits ?? "0",
      currency: tx.currency || currency,
      href: `/family/${encodedSlug}/money`,
    });
  }

  for (const cycle of contributions?.cycles ?? []) {
    if ((cycle.status ?? "").toUpperCase() !== "OVERDUE") continue;
    const expected = toBigIntMinorUnits(cycle.expectedMinorUnits);
    const collected = toBigIntMinorUnits(cycle.collectedMinorUnits);
    const remaining = expected > collected ? expected - collected : 0n;
    if (remaining <= 0n) continue;

    items.push({
      id: `cycle-overdue-${cycle.id}`,
      kind: "overdue-record",
      title: cycle.label,
      subtitle: t((m) => m.FamilyDashboard.overdueBadge),
      date: cycle.dueDate,
      amountMinorUnits: remaining.toString(),
      currency: contributions?.currency ?? currency,
    });
  }

  for (const payment of contributions?.payments ?? []) {
    const statusUpper = (payment.status ?? "").toUpperCase();
    if (statusUpper !== "PENDING" && statusUpper !== "PENDING_VERIFICATION") {
      continue;
    }
    if (seenIds.has(payment.id)) continue;

    const isOwnPayment =
      currentMember !== null &&
      payment.contributor.trim().toLowerCase() ===
        currentMember.fullName.trim().toLowerCase();
    if (!canManageContributions && !canApproveExpense && !isOwnPayment) {
      continue;
    }

    seenIds.add(payment.id);
    items.push({
      id: `contribution-payment-${payment.id}`,
      kind: "awaiting-verification",
      title: `${payment.planName} — ${payment.contributor}`,
      subtitle: payment.method,
      date: payment.date,
      amountMinorUnits: payment.amountMinorUnits,
      currency: contributions?.currency ?? currency,
    });
  }

  return items
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
}

function formatAuditActivityTitle(
  event: FamilyAuditEvent,
  membersByUserId: Map<string, FamilyMemberSummary>,
  membersById: Map<string, FamilyMemberSummary>,
): { title: string; kind: FamilyActivityEntry["kind"] } {
  const actor =
    membersByUserId.get(event.actorId)?.fullName ??
    t((m) => m.FamilyDashboard.systemActor);
  const target =
    (event.targetMemberId
      ? membersById.get(event.targetMemberId)?.fullName
      : null) ?? t((m) => m.FamilyDashboard.memberActor);

  switch (event.action) {
    case "MEMBER_INVITED":
      return {
        title: t((m) => m.FamilyDashboard.auditMemberInvited, { actor }),
        kind: "member-invited",
      };
    case "INVITE_ACCEPTED":
      return {
        title: t((m) => m.FamilyDashboard.auditInviteAccepted, { actor }),
        kind: "member-joined",
      };
    case "MEMBER_UPDATED":
      return {
        title: t((m) => m.FamilyDashboard.auditMemberUpdated, {
          actor,
          target,
        }),
        kind: "member-updated",
      };
    case "MEMBER_REMOVED":
      return {
        title: t((m) => m.FamilyDashboard.auditMemberRemoved, {
          actor,
          target,
        }),
        kind: "member-updated",
      };
    case "HEAD_GRANTED":
      return {
        title: t((m) => m.FamilyDashboard.auditHeadGranted, { actor, target }),
        kind: "member-updated",
      };
    case "FAMILY_SETTINGS_UPDATED":
      return {
        title: t((m) => m.FamilyDashboard.auditSettingsUpdated, { actor }),
        kind: "settings",
      };
  }
}

export function buildFamilyActivityEntries({
  family,
  money,
  contributions,
  projects,
  auditEvents,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  contributions: ContributionsOverview | null;
  projects: ProjectsOverview | null;
  auditEvents: FamilyAuditEvent[] | null;
}): FamilyActivityEntry[] {
  const entries: FamilyActivityEntry[] = [];
  const encodedSlug = encodeURIComponent(family.slug);
  const canViewAudit = hasCapability(family, "MANAGE_MEMBERS");
  const membersByUserId = new Map(
    family.members.map((member) => [member.userId, member]),
  );
  const membersById = new Map(
    family.members.map((member) => [member.id, member]),
  );

  if (canViewAudit && auditEvents) {
    for (const event of auditEvents.slice(0, 5)) {
      const formatted = formatAuditActivityTitle(
        event,
        membersByUserId,
        membersById,
      );
      entries.push({
        id: `audit-${event.id}`,
        kind: formatted.kind,
        title: formatted.title,
        detail: family.name,
        occurredAt: event.createdAt,
        href: `/family/${encodedSlug}/settings/audit`,
      });
    }
  }

  const currency = money?.currency ?? family.defaultCurrency;
  for (const record of (money?.records ?? []).slice(0, 5)) {
    if (!record.date) continue;
    const formattedAmount = formatMinorUnits(record.amountMinorUnits, currency);
    const recordType = record.type.toLowerCase();
    const isIncome = recordType.includes("income");
    const statusUpper = (record.status ?? "").toUpperCase();
    const kind: FamilyActivityEntry["kind"] =
      statusUpper === "REJECTED"
        ? "transaction-rejected"
        : isIncome
          ? "transaction-income"
          : "transaction-expense";

    const actor = record.createdBy ?? family.name;
    const title =
      statusUpper === "REJECTED"
        ? t((m) => m.FamilyDashboard.activityTransactionRejected, {
            title: record.title,
          })
        : t((m) => m.FamilyDashboard.activityTransactionCreated, {
            actor,
            title: record.title,
          });

    entries.push({
      id: `money-${record.id}`,
      kind,
      title,
      detail: `${record.category ?? formatTitle(record.title)} · ${formattedAmount}`,
      occurredAt: record.date,
      href: `/family/${encodedSlug}/money`,
    });
  }

  for (const payment of (contributions?.payments ?? []).slice(0, 4)) {
    if (!payment.date) continue;
    const contribCurrency = contributions?.currency ?? currency;
    const formattedAmount = formatMinorUnits(
      payment.amountMinorUnits,
      contribCurrency,
    );
    const statusUpper = (payment.status ?? "").toUpperCase();
    entries.push({
      id: `contribution-${payment.id}`,
      kind: "contribution",
      title:
        statusUpper === "PENDING" || statusUpper === "PENDING_VERIFICATION"
          ? t((m) => m.FamilyDashboard.activityContributionPending, {
              actor: payment.contributor,
              plan: payment.planName,
            })
          : t((m) => m.FamilyDashboard.activityContributionPaid, {
              actor: payment.contributor,
              plan: payment.planName,
            }),
      detail: `${payment.method} · ${formattedAmount}`,
      occurredAt: payment.date,
    });
  }

  for (const update of (projects?.updates ?? []).slice(0, 4)) {
    if (!update.createdAt) continue;
    entries.push({
      id: `project-update-${update.id}`,
      kind: "project",
      title: t((m) => m.FamilyDashboard.activityProjectUpdate, {
        author: update.createdBy ?? t((m) => m.FamilyDashboard.systemActor),
        project: update.projectName,
      }),
      detail: update.title,
      occurredAt: update.createdAt,
      href: `/family/${encodedSlug}/projects`,
    });
  }

  for (const member of family.members.slice(0, 5)) {
    if (!member.joinedAt) continue;
    entries.push({
      id: `member-joined-${member.id}`,
      kind: "member-joined",
      title: t((m) => m.FamilyDashboard.activityMemberJoined, {
        name: member.fullName,
        role: AUTHORITY_LABELS[member.authority],
      }),
      detail: getKinshipLabel(member),
      occurredAt: member.joinedAt,
      href: `/family/${encodedSlug}/members`,
    });
  }

  return entries
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 5);
}

export type DashboardDataFetcher = <T>(path: string) => Promise<T>;

type CurrentUserResponse = {
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
};

/**
 * Loads all persisted family dashboard sections in parallel using the
 * selected family's `id` and `slug`. Never queries personal `/mine` endpoints.
 */
export async function loadFamilyDashboardData(
  familySlug: string,
  fetcher: DashboardDataFetcher,
): Promise<
  { ok: true; data: FamilyDashboardData } | { ok: false; errorMessage: string }
> {
  const encodedSlug = encodeURIComponent(familySlug);

  const [familyResult, meResult] = await Promise.allSettled([
    fetcher<FamilyDetail>(`/families/${encodedSlug}`),
    fetcher<CurrentUserResponse>("/auth/me"),
  ]);

  if (familyResult.status === "rejected" || !familyResult.value) {
    const reason =
      familyResult.status === "rejected" && familyResult.reason instanceof Error
        ? familyResult.reason.message
        : t((m) => m.FamilyDashboard.familyNotFound);
    return { ok: false, errorMessage: reason };
  }

  const family = familyResult.value;
  const currentUser =
    meResult.status === "fulfilled" ? (meResult.value?.user ?? null) : null;

  const encodedFamilyId = encodeURIComponent(family.id);
  const encodedResolvedSlug = encodeURIComponent(family.slug);
  const canReadAudit = hasCapability(family, "MANAGE_MEMBERS");

  const [
    moneyResult,
    rejectedResult,
    contributionsResult,
    projectsResult,
    loansResult,
    auditResult,
  ] = await Promise.allSettled([
    fetcher<MoneyOverview>(
      `/families/${encodedFamilyId}/money/overview?period=month`,
    ),
    fetcher<RejectedTransactionRow[]>(
      `/families/${encodedFamilyId}/money/transactions?status=REJECTED`,
    ),
    fetcher<ContributionsOverview>(
      `/families/${encodedFamilyId}/contributions/overview?period=month`,
    ),
    fetcher<ProjectsOverview>(
      `/families/${encodedFamilyId}/projects/overview?status=active`,
    ),
    fetcher<unknown>(`/families/${encodedFamilyId}/money/loans?limit=100`),
    canReadAudit
      ? fetcher<FamilyAuditEvent[]>(
          `/families/${encodedResolvedSlug}/audit?limit=10`,
        )
      : Promise.resolve(null),
  ]);

  const warnings: string[] = [];

  if (moneyResult.status === "rejected") {
    warnings.push(t((m) => m.FamilyDashboard.warnings.money));
  }
  if (contributionsResult.status === "rejected") {
    warnings.push(t((m) => m.FamilyDashboard.warnings.contributions));
  }
  if (projectsResult.status === "rejected") {
    warnings.push(t((m) => m.FamilyDashboard.warnings.projects));
  }
  if (loansResult.status === "rejected") {
    warnings.push(t((m) => m.FamilyDashboard.warnings.loans));
  }
  if (canReadAudit && auditResult.status === "rejected") {
    warnings.push(t((m) => m.FamilyDashboard.warnings.audit));
  }

  return {
    ok: true,
    data: {
      family,
      currentUserId: currentUser?.id ?? family.currentMember?.userId ?? null,
      currentUserFullName:
        currentUser?.fullName ?? family.currentMember?.fullName ?? null,
      money:
        moneyResult.status === "fulfilled"
          ? normalizeMoneyOverview(moneyResult.value)
          : null,
      rejectedTransactions:
        rejectedResult.status === "fulfilled" &&
        Array.isArray(rejectedResult.value)
          ? rejectedResult.value
          : null,
      contributions:
        contributionsResult.status === "fulfilled"
          ? contributionsResult.value
          : null,
      projects:
        projectsResult.status === "fulfilled"
          ? normalizeProjectsOverview(projectsResult.value)
          : null,
      loans:
        loansResult.status === "fulfilled"
          ? normalizeLoanRecords(loansResult.value)
          : null,
      auditEvents:
        auditResult.status === "fulfilled" ? auditResult.value : null,
      warnings,
    },
  };
}
