import { describe, expect, it } from "bun:test";
import type { MoneyOverview } from "@/components/family/money/types";
import { aggregateCategoryBreakdown } from "./money-overview-utils";
import type { SharedTransactionItem } from "./types";

describe("Money Overview Mapping & Domain Safety", () => {
  it("normalizes family records into shared transaction items without losing precision", () => {
    const rawFamilyRecords: NonNullable<MoneyOverview["records"]> = [
      {
        id: "tx-101",
        type: "income",
        title: "Land dividend",
        category: "Investments",
        amountMinorUnits: "250000",
        date: "2026-11-01T08:00:00.000Z",
        status: "approved",
        createdBy: "Jean Paul",
      },
      {
        id: "tx-102",
        type: "expense",
        title: "Electricity Token",
        category: "Utilities",
        amountMinorUnits: "15000",
        date: "2026-11-01T09:30:00.000Z",
        status: "pending",
        createdBy: "Marie Rose",
      },
      {
        id: "pay-103",
        type: "contribution",
        title: "Wedding Pot Contribution",
        category: "Family Pots",
        amountMinorUnits: "50000",
        date: "2026-11-01T10:00:00.000Z",
        status: "verified",
        createdBy: "Eric Mugisha",
      },
    ];

    const mapped: SharedTransactionItem[] = rawFamilyRecords.map((record) => {
      const isIncome = record.type === "income";
      const isExpense = record.type === "expense";
      const isContribution = record.type === "contribution";

      return {
        id: record.id,
        title: record.title,
        subtitle: record.category
          ? `${record.category}${record.createdBy ? ` • by ${record.createdBy}` : ""}`
          : (record.createdBy ?? undefined),
        type: isIncome
          ? "income"
          : isExpense
            ? "expense"
            : isContribution
              ? "contribution"
              : "transfer",
        amountMinorUnits: String(record.amountMinorUnits ?? "0"),
        currency: "RWF",
        date: "1 Nov 2026",
        rawDate: record.date ?? undefined,
        status: record.status ?? "approved",
        statusVariant:
          record.status === "verified" || record.status === "approved"
            ? "success"
            : record.status === "pending"
              ? "pending"
              : "neutral",
        category: record.category,
        createdBy: record.createdBy,
      };
    });

    expect(mapped).toHaveLength(3);
    expect(mapped[0].type).toBe("income");
    expect(mapped[0].statusVariant).toBe("success");
    expect(mapped[0].amountMinorUnits).toBe("250000");

    expect(mapped[1].type).toBe("expense");
    expect(mapped[1].statusVariant).toBe("pending");
    expect(mapped[1].amountMinorUnits).toBe("15000");

    expect(mapped[2].type).toBe("contribution");
    expect(mapped[2].statusVariant).toBe("success");
    expect(mapped[2].amountMinorUnits).toBe("50000");
  });

  it("handles null and undefined amounts gracefully during aggregation", () => {
    const rawItems = [
      { categoryId: "c1", categoryName: "Cat 1", amountMinorUnits: null },
      { categoryId: "c2", categoryName: "Cat 2", amountMinorUnits: undefined },
      { categoryId: "c3", categoryName: "Cat 3", amountMinorUnits: "1000" },
    ];

    const result = aggregateCategoryBreakdown(rawItems, "1000");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c3");
    expect(result[0].percentage).toBe(100);
  });

  it("calculates exact percentages when sum equals total", () => {
    const items = [
      {
        categoryId: "c1",
        categoryName: "Groceries",
        amountMinorUnits: "50000",
      },
      { categoryId: "c2", categoryName: "Rent", amountMinorUnits: "50000" },
    ];
    const breakdown = aggregateCategoryBreakdown(items, "100000");
    expect(breakdown[0].percentage).toBe(50);
    expect(breakdown[1].percentage).toBe(50);
  });
});
