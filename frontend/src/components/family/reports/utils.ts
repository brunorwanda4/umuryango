import type { LucideIcon } from "lucide-react";
import {
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ListChecksIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import type {
  ContributionsOverview,
  MoneyMinorValue,
  MoneyOverview,
  ProjectsOverview,
  ReportBreakdownPoint,
  ReportPeriod,
  ReportsOverview,
  ReportTypeFilter,
} from "./types";

export const periodLabels: Record<ReportPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

export const reportTypeLabels: Record<ReportTypeFilter, string> = {
  all: "All reports",
  money: "Money",
  contributions: "Contributions",
  projects: "Projects",
  savings: "Savings",
  debts: "Debts",
  budgets: "Budgets",
};

export const trendConfig = {
  incomeMinorUnits: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenseMinorUnits: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  contributionsPaidMinorUnits: {
    label: "Contributions",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export const breakdownConfig = {
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

export const reportTypes: {
  type: ReportTypeFilter;
  title: string;
  description: string;
  icon: LucideIcon;
  hrefSegment?: string;
}[] = [
  {
    type: "money",
    title: "Money report",
    description: "Income, expenses, approvals, budgets, savings, and debts.",
    icon: WalletCardsIcon,
    hrefSegment: "money",
  },
  {
    type: "contributions",
    title: "Contribution report",
    description: "Expected, paid, overdue, and member contribution progress.",
    icon: HandCoinsIcon,
    hrefSegment: "contributions",
  },
  {
    type: "projects",
    title: "Project report",
    description: "Project budgets, contributions, milestones, and owners.",
    icon: FolderKanbanIcon,
    hrefSegment: "projects",
  },
  {
    type: "savings",
    title: "Savings report",
    description: "Family saving targets, balances, milestones, and movement.",
    icon: TargetIcon,
  },
  {
    type: "debts",
    title: "Debt report",
    description: "Borrowed and lent balances, due dates, and repayments.",
    icon: LandmarkIcon,
  },
  {
    type: "budgets",
    title: "Budget report",
    description: "Approved spending against family category limits.",
    icon: ListChecksIcon,
  },
];

export function normalizeReportsOverview(
  reports?: ReportsOverview,
): ReportsOverview | null {
  if (!reports) {
    return null;
  }

  return {
    ...reports,
    breakdown: Array.isArray(reports.breakdown) ? reports.breakdown : [],
    exports: Array.isArray(reports.exports) ? reports.exports : [],
    reports: Array.isArray(reports.reports) ? reports.reports : [],
    sourceRecords: Array.isArray(reports.sourceRecords)
      ? reports.sourceRecords
      : [],
    trend: Array.isArray(reports.trend) ? reports.trend : [],
  };
}

export function normalizeMoneyOverview(
  money?: MoneyOverview,
): MoneyOverview | null {
  if (!money) {
    return null;
  }

  return {
    ...money,
    allocation: Array.isArray(money.allocation) ? money.allocation : [],
    cashFlow: Array.isArray(money.cashFlow) ? money.cashFlow : [],
    records: Array.isArray(money.records) ? money.records : [],
  };
}

export function normalizeContributionsOverview(
  contributions?: ContributionsOverview,
): ContributionsOverview | null {
  return contributions ?? null;
}

export function normalizeProjectsOverview(
  projects?: ProjectsOverview,
): ProjectsOverview | null {
  return projects ?? null;
}

export function getTrendData(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportTrend = reports?.trend ?? [];

  if (reportTrend.length) {
    return reportTrend.map((point) => ({
      ...point,
      contributionsPaidMinorUnits: toChartNumber(
        point.contributionsPaidMinorUnits,
      ),
      expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
      incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
    }));
  }

  return (money?.cashFlow ?? []).map((point) => ({
    ...point,
    contributionsPaidMinorUnits: 0,
    expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
    incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
  }));
}

export function getBreakdownData(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportBreakdown = reports?.breakdown ?? [];

  if (reportBreakdown.length) {
    return reportBreakdown.map((point) => ({
      ...point,
      amountMinorUnits: toChartNumber(point.amountMinorUnits),
    }));
  }

  return (money?.allocation ?? []).map((point) => ({
    ...point,
    amountMinorUnits: toChartNumber(point.amountMinorUnits),
  }));
}

export function getSourceRecords(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportRecords = reports?.sourceRecords ?? [];

  if (reportRecords.length) {
    return reportRecords;
  }

  return (money?.records ?? []).map((record) => ({
    id: record.id,
    module: record.type,
    title: record.title,
    date: record.date,
    status: record.status,
    amountMinorUnits: record.amountMinorUnits,
    createdBy: record.createdBy,
  }));
}

export function findRecentReport(
  reports: ReportsOverview | null,
  reportType: ReportTypeFilter,
) {
  return (reports?.reports ?? []).find(
    (report) => normalizeKey(report.type) === reportType,
  );
}

export function getSourceRecordCount(
  source:
    | ReportsOverview
    | MoneyOverview
    | ContributionsOverview
    | ProjectsOverview
    | null,
) {
  return typeof source?.sourceRecordCount === "number"
    ? source.sourceRecordCount
    : 0;
}

export function getTrendLabel(value: string) {
  if (value === "incomeMinorUnits") {
    return "Income";
  }

  if (value === "expenseMinorUnits") {
    return "Expenses";
  }

  if (value === "contributionsPaidMinorUnits") {
    return "Contributions";
  }

  return formatTitle(value);
}

export function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "_");
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

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not generated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
