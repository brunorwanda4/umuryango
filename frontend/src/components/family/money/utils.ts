import type { ChartConfig } from "@/components/ui/chart";
import {
  formatOptionalCompactMinorUnits,
  formatCompactMinorUnits as formatSharedCompactMinorUnits,
} from "@/lib/format-compact-number";

export {
  getCurrencyFractionDigits,
  normalizeMinorUnitString,
  toChartNumber,
} from "@/lib/format-compact-number";

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
  return formatOptionalCompactMinorUnits(value, currency);
}

export function formatMinorUnits(value: unknown, currency: string) {
  return formatSharedCompactMinorUnits(value as MoneyMinorValue, currency);
}

export function formatCompactMinorUnits(value: unknown, currency: string) {
  return formatSharedCompactMinorUnits(value as MoneyMinorValue, currency);
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
