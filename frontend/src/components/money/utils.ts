import { formatCompactMinorUnits } from "@/lib/format-compact-number";
import type { MoneyBadgeVariant, MoneyRecordType, MoneyStatus } from "./types";

export function formatMoney(amountMinorUnits: number, currency = "RWF") {
  return formatCompactMinorUnits(amountMinorUnits, currency, "en-RW");
}

export function formatSignedMoney({
  amountMinorUnits,
  currency,
  direction,
}: {
  amountMinorUnits: number;
  currency: string;
  direction: "in" | "out";
}) {
  const sign = direction === "in" ? "+" : "-";

  return `${sign}${formatMoney(Math.abs(amountMinorUnits), currency)}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRecordType(type: MoneyRecordType) {
  const labels: Record<MoneyRecordType, string> = {
    debt: "Debt",
    expense: "Expense",
    income: "Income",
    repayment: "Repayment",
    saving: "Saving",
  };

  return labels[type];
}

export function formatStatus(status: MoneyStatus) {
  const labels: Record<MoneyStatus, string> = {
    active: "Active",
    overdue: "Overdue",
    paid: "Paid",
    planned: "Planned",
    received: "Received",
    settled: "Settled",
  };

  return labels[status];
}

export function getStatusBadgeVariant(status: MoneyStatus): MoneyBadgeVariant {
  if (status === "overdue") return "destructive";
  if (status === "planned") return "outline";
  if (status === "active") return "secondary";

  return "default";
}

export function getProgressPercent(current: number, target: number) {
  if (target <= 0) return 0;

  return Math.min(100, Math.round((current * 100) / target));
}

/**
 * Given a YYYY-MM string, return the ISO date strings for the first and last
 * day of that month (UTC), e.g. { from: "2025-01-01", to: "2025-01-31" }.
 */
export function getMonthPeriod(month: string) {
  const [yearValue, monthValue] = month.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const from = new Date(Date.UTC(year, monthIndex, 1));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/**
 * Format two ISO date strings into a human-readable period label,
 * e.g. "1 Jan 2025 - 31 Jan 2025".
 */
export function formatMonthPeriod(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(new Date(`${from}T00:00:00`))} - ${formatter.format(
    new Date(`${to}T00:00:00`),
  )}`;
}
