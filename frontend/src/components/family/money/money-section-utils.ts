import type { MoneyMinorValue, MoneyRecordRow } from "./types";

export function filterRecordsBySection(
  records: MoneyRecordRow[],
  section: "income" | "expenses" | "receipts",
) {
  if (section === "receipts") {
    return records.filter((record) =>
      ["expense", "income", "purchase", "rent"].some((value) =>
        normalizeRecordType(record.type).includes(value),
      ),
    );
  }

  return records.filter((record) => {
    const type = normalizeRecordType(record.type);

    return section === "income"
      ? type.includes("income")
      : ["expense", "spend", "purchase"].some((value) => type.includes(value));
  });
}

export function summarizeRecordsByCategory(records: MoneyRecordRow[]) {
  const summaries = new Map<
    string,
    {
      category: string;
      recordCount: number;
      incomeMinorUnits: string | null;
      expenseMinorUnits: string | null;
    }
  >();

  for (const record of records) {
    const category = record.category ?? "Uncategorized";
    const existing = summaries.get(category) ?? {
      category,
      recordCount: 0,
      incomeMinorUnits: null,
      expenseMinorUnits: null,
    };
    const type = normalizeRecordType(record.type);
    const amount = normalizeMoneyValue(record.amountMinorUnits);

    existing.recordCount += 1;

    if (type.includes("income")) {
      existing.incomeMinorUnits = addMinorUnits(
        existing.incomeMinorUnits,
        amount,
      );
    } else if (
      ["expense", "spend", "purchase"].some((value) => type.includes(value))
    ) {
      existing.expenseMinorUnits = addMinorUnits(
        existing.expenseMinorUnits,
        amount,
      );
    }

    summaries.set(category, existing);
  }

  return Array.from(summaries.values()).sort((first, second) =>
    first.category.localeCompare(second.category),
  );
}

function normalizeRecordType(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function normalizeMoneyValue(value: MoneyMinorValue | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  return BigInt(0);
}

function addMinorUnits(current: string | null, amount: bigint): string | null {
  if (amount === BigInt(0) && current === null) {
    return null;
  }

  return ((current ? BigInt(current) : BigInt(0)) + amount).toString();
}
