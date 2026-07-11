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
