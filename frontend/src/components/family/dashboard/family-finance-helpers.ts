import { MOCK_TRANSACTIONS } from "../money/mock-finance-data";
import type { MoneyRecordRow } from "../money/types";
import { formatTitle, normalizeMinorUnitString } from "../money/utils";

export type AmountValue = number | string | null | undefined;

export type ExpenseCategoryRow = {
  name: string;
  amount: AmountValue;
  lastMonth?: AmountValue;
  count?: number;
};

export type IncomeSourceRow = {
  name: string;
  amount: AmountValue;
  frequency: string;
};

export type TransactionRow = {
  id: string;
  date: string;
  category: string;
  member: string;
  method: string;
  amount: AmountValue;
  type: "income" | "expense" | "other";
};

export function getExpenseCategories(
  records: MoneyRecordRow[],
): ExpenseCategoryRow[] {
  const totals = new Map<string, { amount: string; count: number }>();

  for (const record of records) {
    if (!isRecordType(record, "expense")) continue;

    const name = record.category ?? "Uncategorized";
    const current = totals.get(name) ?? { amount: "0", count: 0 };

    totals.set(name, {
      amount: addMinorValues(current.amount, record.amountMinorUnits),
      count: current.count + 1,
    });
  }

  return Array.from(totals.entries()).map(([name, value]) => ({
    name,
    amount: value.amount,
    count: value.count,
  }));
}

export function getIncomeSources(records: MoneyRecordRow[]): IncomeSourceRow[] {
  const totals = new Map<string, string>();

  for (const record of records) {
    if (!isRecordType(record, "income")) continue;

    const name = record.category ?? formatTitle(record.title);
    totals.set(
      name,
      addMinorValues(totals.get(name) ?? "0", record.amountMinorUnits),
    );
  }

  return Array.from(totals.entries()).map(([name, amount]) => ({
    name,
    amount,
    frequency: "Saved records",
  }));
}

export function getRecentTransactions(
  records: MoneyRecordRow[],
): TransactionRow[] {
  return records.slice(0, 10).map((record) => ({
    id: record.id,
    date: record.date ?? "Not dated",
    category: record.category ?? formatTitle(record.title),
    member: record.createdBy ?? "Family",
    method: record.status ?? "Saved",
    amount: record.amountMinorUnits,
    type: isRecordType(record, "income")
      ? "income"
      : isRecordType(record, "expense")
        ? "expense"
        : "other",
  }));
}

export function getDemoTransactions(): TransactionRow[] {
  return MOCK_TRANSACTIONS.map((record) => ({
    id: record.id,
    date: record.date,
    category: record.category,
    member: record.member,
    method: record.method,
    amount: record.amount,
    type:
      record.type === "income"
        ? "income"
        : record.type === "expense"
          ? "expense"
          : "other",
  }));
}

export function isRecordType(
  record: MoneyRecordRow,
  expected: "income" | "expense",
) {
  return record.type.toLowerCase().includes(expected);
}

export function addMinorValues(current: string, next: AmountValue) {
  const normalized = normalizeMinorUnitString(next);

  if (!normalized) {
    return current;
  }

  return (BigInt(current) + BigInt(normalized)).toString();
}
