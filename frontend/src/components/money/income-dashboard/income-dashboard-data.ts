import type { LucideIcon } from "lucide-react";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CircleDollarSignIcon,
  GiftIcon,
  LandmarkIcon,
  SmartphoneIcon,
  UserIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import { toChartNumber } from "@/lib/format-compact-number";

export type IncomeCategory = {
  color: string | null;
  icon: string | null;
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  type: "INCOME" | "EXPENSE";
};

export type IncomeTransaction = {
  amountMinorUnits: string;
  category: { color?: string | null; icon?: string | null; name: string };
  categoryId: string;
  createdAt: string;
  createdById: string;
  currency: string;
  date: string;
  description: string | null;
  familyId: string;
  id: string;
  notes: string | null;
  paymentMethod: string | null;
  reversedAt: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";
  type: "INCOME" | "EXPENSE";
  updatedAt: string;
};

export type IncomeDashboardResponse = {
  byCategory: Array<{ amountMinorUnits: string; category: string }>;
  overTime: Array<{ amountMinorUnits: string; date: string }>;
  period: { from: string; to: string };
  records: IncomeTransaction[];
  summary: {
    allTimeTotalMinorUnits: string;
    approvedTransactionCount: number;
    largestIncome: {
      amountMinorUnits: string;
      category: string;
      description: string | null;
    } | null;
    periodTotalMinorUnits: string;
  };
};

export type IncomeSourceDatum = {
  amountMinorUnits: number;
  amountMinorUnitsValue: string;
  color: string;
  name: string;
};

export type IncomeOverTimeDatum = {
  amount: number;
  amountMinorUnits: string;
  day: string;
};

export type RecentIncomeRecord = {
  account: string;
  amountMinorUnits: string;
  category: string;
  categoryClassName: string;
  categoryId: string;
  currency: string;
  date: string;
  dateValue: string;
  description: string;
  icon: LucideIcon;
  id: string;
  notes: string;
  paymentClassName: string;
  paymentIcon: LucideIcon;
  paymentMethod: string;
  source: string;
  sourceClassName: string;
  status: IncomeTransaction["status"];
};

const chartColors = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

export function mapIncomeDashboard(data: IncomeDashboardResponse) {
  const incomeSourceData = data.byCategory.map((source, index) => ({
    amountMinorUnits: toChartNumber(source.amountMinorUnits),
    amountMinorUnitsValue: source.amountMinorUnits,
    color: chartColors[index % chartColors.length] ?? "var(--chart-2)",
    name: source.category,
  }));
  const incomeOverTimeData = data.overTime.map((point) => ({
    amount: toChartNumber(point.amountMinorUnits),
    amountMinorUnits: point.amountMinorUnits,
    day: formatShortDate(point.date),
  }));

  return {
    incomeOverTimeData,
    incomeSourceData,
    recentIncomeData: data.records.map(mapIncomeRecord),
    totalIncomeMinorUnits: data.summary.periodTotalMinorUnits,
  };
}

function mapIncomeRecord(transaction: IncomeTransaction): RecentIncomeRecord {
  const category = transaction.category.name;
  const account = transaction.paymentMethod ?? "OTHER";
  const categoryStyle = getCategoryStyle(category);
  const paymentStyle = getPaymentStyle(account);

  return {
    account,
    amountMinorUnits: transaction.amountMinorUnits,
    category,
    categoryClassName: categoryStyle.className,
    categoryId: transaction.categoryId,
    currency: transaction.currency,
    date: formatLongDate(transaction.date),
    dateValue: transaction.date.slice(0, 10),
    description: transaction.notes ?? "No additional notes",
    icon: categoryStyle.icon,
    id: transaction.id,
    notes: transaction.notes ?? "",
    paymentClassName: paymentStyle.className,
    paymentIcon: paymentStyle.icon,
    paymentMethod: formatPaymentMethod(account),
    source: transaction.description ?? category,
    sourceClassName: categoryStyle.className,
    status: transaction.status,
  };
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("salary")) {
    return { icon: UserIcon, className: "bg-chart-2/10 text-chart-2" };
  }
  if (normalized.includes("business")) {
    return {
      icon: BriefcaseBusinessIcon,
      className: "bg-chart-1/10 text-chart-1",
    };
  }
  if (normalized.includes("contribution") || normalized.includes("support")) {
    return { icon: UsersIcon, className: "bg-chart-4/10 text-chart-4" };
  }
  if (normalized.includes("gift")) {
    return { icon: GiftIcon, className: "bg-chart-5/10 text-chart-5" };
  }
  return {
    icon: CircleDollarSignIcon,
    className: "bg-muted text-muted-foreground",
  };
}

function getPaymentStyle(account: string) {
  if (account.includes("BANK")) {
    return { icon: LandmarkIcon, className: "bg-chart-1 text-background" };
  }
  if (account.includes("MOBILE")) {
    return { icon: SmartphoneIcon, className: "bg-chart-5 text-background" };
  }
  if (account.includes("CASH")) {
    return { icon: BanknoteIcon, className: "bg-chart-2 text-background" };
  }
  return { icon: WalletCardsIcon, className: "bg-muted text-foreground" };
}

function formatPaymentMethod(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}
