import type { ChartConfig } from "@/components/ui/chart";
import type { MoneyMinorValue, MoneyOverview, MoneyPeriod } from "./types";

export const periodLabels: Record<MoneyPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

export const cashFlowConfig = {
  incomeMinorUnits: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenseMinorUnits: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export const allocationConfig = {
  amountMinorUnits: {
    label: "Amount",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export const summarySkeletonKeys = [
  "cash",
  "income",
  "expenses",
  "contributions",
  "savings",
  "debts",
];

type MoneyAmountTotalKey = Exclude<
  keyof NonNullable<MoneyOverview["totals"]>,
  "pendingApprovalCount" | "overdueCount"
>;

const moneyTotalAliases = {
  cashBalanceMinorUnits: [
    "cashBalanceMinorUnits",
    "balanceMinorUnits",
    "cashBalance",
    "balance",
  ],
  incomeMinorUnits: [
    "incomeMinorUnits",
    "totalIncomeMinorUnits",
    "income",
    "totalIncome",
  ],
  expenseMinorUnits: [
    "expenseMinorUnits",
    "expensesMinorUnits",
    "totalExpenseMinorUnits",
    "totalExpensesMinorUnits",
    "expense",
    "expenses",
    "totalExpense",
    "totalExpenses",
  ],
  contributionsPaidMinorUnits: [
    "contributionsPaidMinorUnits",
    "contributionPaidMinorUnits",
    "totalContributionsPaidMinorUnits",
    "contributionsPaid",
    "totalContributionsPaid",
  ],
  savingsMinorUnits: [
    "savingsMinorUnits",
    "totalSavingsMinorUnits",
    "savings",
    "totalSavings",
  ],
  debtOutstandingMinorUnits: [
    "debtOutstandingMinorUnits",
    "debtsMinorUnits",
    "totalDebtOutstandingMinorUnits",
    "debtOutstanding",
    "debts",
    "totalDebts",
  ],
} satisfies Record<MoneyAmountTotalKey, string[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasMoneyOverviewShape(value: Record<string, unknown>) {
  return (
    "totals" in value ||
    "currency" in value ||
    "cashFlow" in value ||
    "allocation" in value ||
    "records" in value
  );
}

function unwrapMoneyOverview(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (isRecord(value.data) && hasMoneyOverviewShape(value.data)) {
    return value.data;
  }

  return value;
}

function readMinorValue(
  source: Record<string, unknown> | undefined,
  aliases: string[],
) {
  if (!source) {
    return undefined;
  }

  for (const key of aliases) {
    const value = source[key];

    if (
      value === null ||
      typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      return value;
    }
  }

  return undefined;
}

function readNumberValue(
  source: Record<string, unknown> | undefined,
  aliases: string[],
) {
  if (!source) {
    return undefined;
  }

  for (const key of aliases) {
    const value = source[key];

    if (
      value === null ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      return value;
    }
  }

  return undefined;
}

function normalizeMoneyTotals(
  money: Record<string, unknown>,
): MoneyOverview["totals"] {
  const totals = isRecord(money.totals) ? money.totals : undefined;
  const fallbackSource = money;
  const normalizedTotals: MoneyOverview["totals"] = {
    ...(totals as MoneyOverview["totals"] | undefined),
  };

  for (const key of Object.keys(moneyTotalAliases) as Array<
    keyof typeof moneyTotalAliases
  >) {
    const value =
      readMinorValue(totals, moneyTotalAliases[key]) ??
      readMinorValue(fallbackSource, moneyTotalAliases[key]);

    if (value !== undefined) {
      normalizedTotals[key] = value;
    }
  }

  const pendingApprovalCount =
    readNumberValue(totals, ["pendingApprovalCount"]) ??
    readNumberValue(fallbackSource, ["pendingApprovalCount"]);
  const overdueCount =
    readNumberValue(totals, ["overdueCount"]) ??
    readNumberValue(fallbackSource, ["overdueCount"]);

  if (pendingApprovalCount !== undefined) {
    normalizedTotals.pendingApprovalCount = pendingApprovalCount;
  }

  if (overdueCount !== undefined) {
    normalizedTotals.overdueCount = overdueCount;
  }

  return Object.values(normalizedTotals).some((value) => value !== undefined)
    ? normalizedTotals
    : undefined;
}

export function normalizeMoneyOverview(money?: unknown): MoneyOverview | null {
  const overview = unwrapMoneyOverview(money);

  if (!overview) {
    return null;
  }

  return {
    ...(overview as MoneyOverview),
    totals: normalizeMoneyTotals(overview),
    allocation: Array.isArray(overview.allocation) ? overview.allocation : [],
    approvals: Array.isArray(overview.approvals) ? overview.approvals : [],
    budgets: Array.isArray(overview.budgets) ? overview.budgets : [],
    cashFlow: Array.isArray(overview.cashFlow) ? overview.cashFlow : [],
    records: Array.isArray(overview.records) ? overview.records : [],
  };
}

export function formatOptionalMoney(
  value: MoneyMinorValue | null | undefined,
  currency: string,
) {
  if (value === null || value === undefined) {
    return "No records";
  }

  return formatMinorUnits(value, currency);
}

export function formatMinorUnits(value: unknown, currency: string) {
  const normalized = normalizeMinorUnitString(value);

  if (!normalized) {
    return `${currency} ${String(value)}`;
  }

  const digits = getCurrencyFractionDigits(currency);
  const negative = normalized.startsWith("-");
  const absolute = negative ? normalized.slice(1) : normalized;

  if (digits === 0) {
    return `${negative ? "-" : ""}${currency} ${groupDigits(absolute)}`;
  }

  const padded = absolute.padStart(digits + 1, "0");
  const major = padded.slice(0, -digits);
  const minor = padded.slice(-digits);

  return `${negative ? "-" : ""}${currency} ${groupDigits(major)}.${minor}`;
}

export function formatCompactMinorUnits(value: unknown, currency: string) {
  const numeric = toChartNumber(value);
  const digits = getCurrencyFractionDigits(currency);
  const divisor = 10 ** digits;
  const major = numeric / divisor;

  return `${currency} ${Intl.NumberFormat("en", {
    compactDisplay: "short",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(major)}`;
}

export function normalizeMinorUnitString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return value;
  }

  return null;
}

export function getCurrencyFractionDigits(currency: string) {
  try {
    const maximumFractionDigits = new Intl.NumberFormat("en", {
      currency,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;

    return typeof maximumFractionDigits === "number"
      ? maximumFractionDigits
      : 2;
  } catch {
    return 2;
  }
}

export function groupDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toChartNumber(value: unknown) {
  const numeric = typeof value === "string" ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : 0;
}

export function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function formatTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not dated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
