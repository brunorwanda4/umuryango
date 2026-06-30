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

export function normalizeMoneyOverview(money?: MoneyOverview): MoneyOverview | null {
  if (!money) {
    return null;
  }

  return {
    ...money,
    allocation: Array.isArray(money.allocation) ? money.allocation : [],
    approvals: Array.isArray(money.approvals) ? money.approvals : [],
    budgets: Array.isArray(money.budgets) ? money.budgets : [],
    cashFlow: Array.isArray(money.cashFlow) ? money.cashFlow : [],
    records: Array.isArray(money.records) ? money.records : [],
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
