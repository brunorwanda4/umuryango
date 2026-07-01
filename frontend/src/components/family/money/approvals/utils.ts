import type { MoneyApprovalRow } from "../types";
import { formatTitle, toChartNumber } from "../utils";
import type {
  ApprovalAnalyticsModel,
  ApprovalFilters,
  ApprovalPriority,
  ApprovalQueueItem,
  ApprovalStatus,
  ApprovalType,
  MoneyTransaction,
} from "./types";

export const EMPTY_FILTERS: ApprovalFilters = {
  search: "",
  type: "all",
  status: "all",
  category: "all",
  requestedBy: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  priority: "all",
};

export const approvalChartConfig = {
  pending: { label: "Pending", color: "var(--chart-3)" },
  approved: { label: "Approved", color: "var(--chart-4)" },
  rejected: { label: "Rejected", color: "var(--chart-2)" },
  averageHours: { label: "Average hours", color: "var(--chart-1)" },
  count: { label: "Approvals", color: "var(--chart-5)" },
} as const;

export function buildApprovalQueue(
  transactions: MoneyTransaction[],
  overviewApprovals: MoneyApprovalRow[],
): ApprovalQueueItem[] {
  const pendingTransactions = transactions
    .filter((transaction) => transaction.status === "PENDING")
    .map(transactionToApproval);
  const transactionIds = new Set(pendingTransactions.map((item) => item.id));
  const overviewOnlyApprovals = overviewApprovals
    .filter((approval) => !transactionIds.has(approval.id))
    .map(overviewRowToApproval);

  return [...pendingTransactions, ...overviewOnlyApprovals].sort(
    (first, second) => getTime(second.submittedAt) - getTime(first.submittedAt),
  );
}

export function transactionToApproval(
  transaction: MoneyTransaction,
): ApprovalQueueItem {
  return {
    id: transaction.id,
    source: "transaction",
    type: transaction.type,
    title:
      transaction.description || `${formatTitle(transaction.type)} Transaction`,
    category: transaction.category?.name ?? "Uncategorized",
    amountMinorUnits: transaction.amountMinorUnits,
    requestedById: transaction.createdById,
    requestedBy: transaction.createdBy?.fullName ?? "Unknown member",
    submittedAt: transaction.createdAt,
    priority: inferPriority(
      transaction.amountMinorUnits,
      transaction.createdAt,
    ),
    status: transaction.status,
    description:
      transaction.notes ||
      transaction.description ||
      "No additional description was recorded.",
    paymentMethod: transaction.paymentMethod
      ? formatTitle(transaction.paymentMethod)
      : "Not recorded",
    receipt: "Not attached",
    budget: "Not linked",
    relatedProject: "Not linked",
    currentApprover: "Finance approver",
    previousApprovers: transaction.approvedBy?.fullName
      ? [transaction.approvedBy.fullName]
      : [],
    transaction,
  };
}

export function overviewRowToApproval(
  row: MoneyApprovalRow,
): ApprovalQueueItem {
  const normalizedType = normalizeApprovalType(row.type);

  return {
    id: row.id,
    source: "overview",
    type: normalizedType,
    title: row.title,
    category: normalizedType === "CONTRIBUTION" ? "Contribution" : "General",
    amountMinorUnits: row.amountMinorUnits?.toString() ?? null,
    requestedById: null,
    requestedBy: row.submittedBy ?? "Unknown member",
    submittedAt: row.submittedAt ?? null,
    priority: inferPriority(row.amountMinorUnits, row.submittedAt),
    status: normalizeStatus(row.status),
    description:
      "This approval is listed by the money overview. Open the source module for full supporting details.",
    paymentMethod: "Not recorded",
    receipt: "Not attached",
    budget: "Not linked",
    relatedProject: "Not linked",
    currentApprover: "Finance approver",
    previousApprovers: [],
  };
}

export function filterApprovals(
  approvals: ApprovalQueueItem[],
  filters: ApprovalFilters,
) {
  const min = filters.minAmount
    ? Number(filters.minAmount.replace(/,/g, ""))
    : null;
  const max = filters.maxAmount
    ? Number(filters.maxAmount.replace(/,/g, ""))
    : null;

  return approvals.filter((approval) => {
    const searchText = [
      approval.title,
      approval.category,
      approval.requestedBy,
      approval.description,
      approval.type,
      approval.status,
    ]
      .join(" ")
      .toLowerCase();
    const amount = toChartNumber(approval.amountMinorUnits);
    const submittedTime = getTime(approval.submittedAt);
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    if (endDate) endDate.setDate(endDate.getDate() + 1);

    return (
      (!filters.search ||
        searchText.includes(filters.search.trim().toLowerCase())) &&
      (filters.type === "all" || approval.type === filters.type) &&
      (filters.status === "all" || approval.status === filters.status) &&
      (filters.category === "all" || approval.category === filters.category) &&
      (filters.requestedBy === "all" ||
        approval.requestedBy === filters.requestedBy) &&
      (!filters.priority ||
        filters.priority === "all" ||
        approval.priority === filters.priority) &&
      (!filters.startDate ||
        submittedTime >= new Date(filters.startDate).getTime()) &&
      (!endDate || submittedTime < endDate.getTime()) &&
      (min === null || Number.isNaN(min) || amount >= min) &&
      (max === null || Number.isNaN(max) || amount <= max)
    );
  });
}

export function buildApprovalAnalytics(
  transactions: MoneyTransaction[],
  queue: ApprovalQueueItem[],
): ApprovalAnalyticsModel {
  const now = new Date();
  const todayKey = toDateKey(now);
  const monthKey = toMonthKey(now);
  const approvedTransactions = transactions.filter(
    (transaction) => transaction.status === "APPROVED",
  );
  const rejectedTransactions = transactions.filter(
    (transaction) => transaction.status === "REJECTED",
  );
  const approvedToday = approvedTransactions.filter(
    (transaction) => toDateKey(transaction.approvedAt) === todayKey,
  ).length;
  const rejectedToday = rejectedTransactions.filter(
    (transaction) => toDateKey(transaction.updatedAt) === todayKey,
  ).length;
  const approvedThisMonthMinorUnits = approvedTransactions
    .filter((transaction) => toMonthKey(transaction.approvedAt) === monthKey)
    .reduce(
      (sum, transaction) => sum + BigInt(transaction.amountMinorUnits || "0"),
      BigInt(0),
    )
    .toString();
  const approvalDurations = approvedTransactions
    .map((transaction) => {
      if (!transaction.approvedAt) return null;

      const duration =
        (new Date(transaction.approvedAt).getTime() -
          new Date(transaction.createdAt).getTime()) /
        3_600_000;

      return Number.isFinite(duration) && duration >= 0 ? duration : null;
    })
    .filter((value): value is number => value !== null);
  const averageApprovalHours = approvalDurations.length
    ? approvalDurations.reduce((sum, value) => sum + value, 0) /
      approvalDurations.length
    : null;
  const decisionCount =
    approvedTransactions.length + rejectedTransactions.length;
  const approvalPercent = decisionCount
    ? (approvedTransactions.length / decisionCount) * 100
    : 0;

  return {
    pendingCount: queue.length,
    approvedToday,
    rejectedToday,
    approvedThisMonthMinorUnits,
    averageApprovalHours,
    myPendingReviews: queue.length,
    approvalPercent,
    statusComparison: [
      { label: "Pending", count: queue.length, fill: "var(--chart-3)" },
      {
        label: "Approved",
        count: approvedTransactions.length,
        fill: "var(--chart-4)",
      },
      {
        label: "Rejected",
        count: rejectedTransactions.length,
        fill: "var(--chart-2)",
      },
    ],
    approvalRate: [
      {
        label: "Approved",
        count: approvedTransactions.length,
        fill: "var(--chart-4)",
      },
      {
        label: "Rejected",
        count: rejectedTransactions.length,
        fill: "var(--chart-2)",
      },
    ],
    approvalsByMonth: groupCountByMonth(
      approvedTransactions,
      (transaction) => transaction.approvedAt,
    ),
    approvalTimeByMonth: groupAverageApprovalTimeByMonth(approvedTransactions),
    approvalsByCategory: groupApprovedAmountByCategory(approvedTransactions),
    rejectionsByCategory: groupRejectedCountByCategory(rejectedTransactions),
  };
}

export function buildApprovalTimeline(approval: ApprovalQueueItem) {
  const items = [
    {
      user: approval.requestedBy,
      action: "Created",
      date: approval.transaction?.createdAt ?? approval.submittedAt,
      comment: "Financial record created for family review.",
    },
    {
      user: approval.requestedBy,
      action: "Submitted",
      date: approval.submittedAt,
      comment: "Submitted to the approval queue.",
    },
  ];

  if (approval.transaction?.updatedAt) {
    items.push({
      user: "Family audit",
      action: "Reviewed",
      date: approval.transaction.updatedAt,
      comment: "Latest persisted review state.",
    });
  }

  if (approval.status === "APPROVED" && approval.transaction?.approvedAt) {
    items.push({
      user: approval.transaction.approvedBy?.fullName ?? "Approver",
      action: "Approved",
      date: approval.transaction.approvedAt,
      comment: "Record approved and locked for reporting.",
    });
  }

  if (approval.status === "REJECTED") {
    items.push({
      user: "Approver",
      action: "Rejected",
      date: approval.transaction?.updatedAt ?? approval.submittedAt,
      comment: "Rejected records remain visible with audit history.",
    });
  }

  return items.filter((item) => item.date);
}

export function normalizeApprovalType(value: string): ApprovalType {
  const normalized = value.toUpperCase();
  if (normalized.includes("INCOME")) return "INCOME";
  if (normalized.includes("EXPENSE")) return "EXPENSE";
  if (normalized.includes("BUDGET")) return "BUDGET";
  if (normalized.includes("CONTRIBUTION")) return "CONTRIBUTION";
  if (normalized.includes("TRANSACTION")) return "TRANSACTION";

  return "OTHER";
}

export function normalizeStatus(
  value: string | null | undefined,
): ApprovalStatus {
  const normalized = value?.toUpperCase();
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CHANGES_REQUESTED") return "CHANGES_REQUESTED";
  if (normalized === "DRAFT") return "DRAFT";
  if (normalized === "REVERSED") return "REVERSED";

  return "PENDING";
}

export function inferPriority(
  amountMinorUnits: unknown,
  submittedAt: string | null | undefined,
): ApprovalPriority {
  const amount = toChartNumber(amountMinorUnits);
  const ageHours =
    submittedAt && getTime(submittedAt)
      ? (Date.now() - getTime(submittedAt)) / 3_600_000
      : 0;

  if (ageHours >= 72 || amount >= 5_000_000) return "URGENT";
  if (ageHours >= 24 || amount >= 1_000_000) return "HIGH";
  if (amount <= 50_000) return "LOW";

  return "NORMAL";
}

export function groupCountByMonth<T>(
  records: T[],
  getDate: (record: T) => string | null,
) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const date = getDate(record);
    if (!date) continue;

    const key = toMonthKey(date);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return mapMonthEntries(grouped, "count");
}

export function groupAverageApprovalTimeByMonth(records: MoneyTransaction[]) {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const record of records) {
    if (!record.approvedAt) continue;

    const key = toMonthKey(record.approvedAt);
    const duration =
      (new Date(record.approvedAt).getTime() -
        new Date(record.createdAt).getTime()) /
      3_600_000;

    if (!Number.isFinite(duration) || duration < 0) continue;

    const current = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, {
      total: current.total + duration,
      count: current.count + 1,
    });
  }

  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => ({
      label: formatMonthKey(key),
      averageHours: value.count
        ? Number((value.total / value.count).toFixed(2))
        : 0,
    }));
}

export function groupApprovedAmountByCategory(records: MoneyTransaction[]) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const category = record.category?.name ?? "Uncategorized";
    grouped.set(
      category,
      (grouped.get(category) ?? 0) + toChartNumber(record.amountMinorUnits),
    );
  }

  return Array.from(grouped.entries())
    .sort(([, first], [, second]) => second - first)
    .slice(0, 8)
    .map(([label, amount]) => ({ label, amount }));
}

export function groupRejectedCountByCategory(records: MoneyTransaction[]) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const category = record.category?.name ?? "Uncategorized";
    grouped.set(category, (grouped.get(category) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .sort(([, first], [, second]) => second - first)
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
}

export function mapMonthEntries(
  grouped: Map<string, number>,
  valueKey: "count",
) {
  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => ({
      label: formatMonthKey(key),
      [valueKey]: value,
    })) as { label: string; count: number }[];
}

export function toDateKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function toMonthKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 7);
}

export function formatMonthKey(value: string) {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function getTime(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
