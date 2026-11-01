import { describe, expect, it } from "bun:test";
import {
  aggregateCategoryBreakdown,
  buildCashflowBuckets,
  calculatePercentage,
  resolvePersonalPeriodRange,
} from "./money-overview-utils";

describe("Money Overview Utilities", () => {
  describe("resolvePersonalPeriodRange", () => {
    it("resolves this_month deterministically", () => {
      const refDate = new Date("2026-11-15T12:00:00Z");
      const range = resolvePersonalPeriodRange("this_month", refDate);
      expect(range.from).toBe("2026-11-01");
      expect(range.to).toBe("2026-11-30");
      expect(range.label).toBe("This Month");
    });

    it("resolves last_month deterministically within the same year", () => {
      const refDate = new Date("2026-11-15T12:00:00Z");
      const range = resolvePersonalPeriodRange("last_month", refDate);
      expect(range.from).toBe("2026-10-01");
      expect(range.to).toBe("2026-10-31");
      expect(range.label).toBe("Last Month");
    });

    it("resolves last_month across year boundary (January -> previous December)", () => {
      const refDate = new Date("2026-01-10T12:00:00Z");
      const range = resolvePersonalPeriodRange("last_month", refDate);
      expect(range.from).toBe("2025-12-01");
      expect(range.to).toBe("2025-12-31");
    });

    it("resolves this_year deterministically", () => {
      const refDate = new Date("2026-05-20T12:00:00Z");
      const range = resolvePersonalPeriodRange("this_year", refDate);
      expect(range.from).toBe("2026-01-01");
      expect(range.to).toBe("2026-12-31");
      expect(range.label).toBe("Year 2026");
    });

    it("ensures all generated ranges stay within the 366-day limit", () => {
      const refDate = new Date("2026-11-01T10:00:00Z");
      const periods = ["this_month", "last_month", "this_year"] as const;
      for (const p of periods) {
        const range = resolvePersonalPeriodRange(p, refDate);
        const fromTime = new Date(range.from).getTime();
        const toTime = new Date(range.to).getTime();
        const days = (toTime - fromTime) / 86400000;
        expect(days).toBeLessThanOrEqual(366);
      }
    });
  });

  describe("calculatePercentage", () => {
    it("calculates percentage accurately with BigInt", () => {
      expect(calculatePercentage("217000", "620000")).toBe(35);
      expect(calculatePercentage("155000", "620000")).toBe(25);
      expect(calculatePercentage("124000", "620000")).toBe(20);
    });

    it("handles zero denominator safely without crashing or NaN", () => {
      expect(calculatePercentage("100", "0")).toBe(0);
      expect(calculatePercentage("100", null)).toBe(0);
      expect(calculatePercentage("0", "100")).toBe(0);
    });

    it("handles large minor units exceeding standard JS float precision", () => {
      const hugeTotal = "9007199254740992"; // 2^53
      const half = "4503599627370496";
      expect(calculatePercentage(half, hugeTotal)).toBe(50);
    });
  });

  describe("aggregateCategoryBreakdown", () => {
    it("aggregates categories by ID and calculates percentages", () => {
      const items = [
        {
          categoryId: "cat-1",
          categoryName: "Food & Groceries",
          amountMinorUnits: "150000",
        },
        {
          categoryId: "cat-1",
          categoryName: "Food & Groceries",
          amountMinorUnits: "50000",
        },
        {
          categoryId: "cat-2",
          categoryName: "Transport",
          amountMinorUnits: "100000",
        },
      ];

      const result = aggregateCategoryBreakdown(items, "300000");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("cat-1");
      expect(result[0].name).toBe("Food & Groceries");
      expect(result[0].amountMinorUnits).toBe("200000");
      expect(result[0].percentage).toBe(67);
      expect(result[0].count).toBe(2);

      expect(result[1].id).toBe("cat-2");
      expect(result[1].name).toBe("Transport");
      expect(result[1].amountMinorUnits).toBe("100000");
      expect(result[1].percentage).toBe(33);
      expect(result[1].count).toBe(1);
    });

    it("returns empty array when items have zero or negative amounts", () => {
      const items = [
        {
          categoryId: "cat-1",
          categoryName: "Empty",
          amountMinorUnits: "0",
        },
      ];
      const result = aggregateCategoryBreakdown(items, "1000");
      expect(result).toHaveLength(0);
    });
  });

  describe("buildCashflowBuckets", () => {
    it("buckets into 4 weeks for monthly periods", () => {
      const incomes = [
        { date: "2026-11-03T10:00:00Z", amountMinorUnits: "100000" },
        { date: "2026-11-15T10:00:00Z", amountMinorUnits: "250000" },
      ];
      const expenses = [
        { date: "2026-11-04T10:00:00Z", amountMinorUnits: "50000" },
      ];

      const buckets = buildCashflowBuckets(incomes, expenses, "this_month");
      expect(buckets).toHaveLength(4);
      expect(buckets[0].incomeMinorUnits).toBe(100000);
      expect(buckets[0].expenseMinorUnits).toBe(50000);
      expect(buckets[2].incomeMinorUnits).toBe(250000);
    });
  });
});
