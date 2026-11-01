import { describe, expect, it } from "bun:test";
import {
  addMinorUnits,
  getDirectionTheme,
  normalizeMinorUnits,
  safeCalculatePercentage,
} from "./money-section-utils";

describe("Money Section Utilities", () => {
  describe("normalizeMinorUnits", () => {
    it("handles null, undefined, and empty strings safely", () => {
      expect(normalizeMinorUnits(null)).toBe("0");
      expect(normalizeMinorUnits(undefined)).toBe("0");
      expect(normalizeMinorUnits("")).toBe("0");
      expect(normalizeMinorUnits("   ")).toBe("0");
    });

    it("parses valid integer strings and numbers without precision loss", () => {
      expect(normalizeMinorUnits("1450000")).toBe("1450000");
      expect(normalizeMinorUnits(1450000)).toBe("1450000");
      expect(normalizeMinorUnits("9007199254740991000")).toBe(
        "9007199254740991000",
      );
    });

    it("strips decimals safely without floating-point evaluation", () => {
      expect(normalizeMinorUnits("1450000.99")).toBe("1450000");
    });
  });

  describe("addMinorUnits", () => {
    it("adds multiple values accurately using BigInt", () => {
      expect(addMinorUnits("100000", "250000", "50000")).toBe("400000");
      expect(addMinorUnits("0", null, undefined, "150000")).toBe("150000");
    });

    it("handles large amounts exceeding 53-bit integers", () => {
      const a = "900719925474099100";
      const b = "100";
      expect(addMinorUnits(a, b)).toBe("900719925474099200");
    });
  });

  describe("safeCalculatePercentage", () => {
    it("calculates percentage safely without NaN or infinity", () => {
      expect(safeCalculatePercentage("50", "100")).toBe(50);
      expect(safeCalculatePercentage("1450000", "1800000")).toBe(81);
      expect(safeCalculatePercentage("0", "100000")).toBe(0);
      expect(safeCalculatePercentage("100000", "0")).toBe(0);
      expect(safeCalculatePercentage(null, "100000")).toBe(0);
      expect(safeCalculatePercentage("100000", null)).toBe(0);
    });

    it("clamps percentages between 0 and 100", () => {
      expect(safeCalculatePercentage("-10", "100")).toBe(0);
      expect(safeCalculatePercentage("150", "100")).toBe(100);
    });
  });

  describe("getDirectionTheme", () => {
    it("returns positive emerald tokens for income", () => {
      const incomeTheme = getDirectionTheme("income");
      expect(incomeTheme.textAccent).toBe("text-emerald-400");
      expect(incomeTheme.amountPrefix).toBe("+");
      expect(incomeTheme.indicatorColor).toBe("emerald");
    });

    it("returns outflow rose tokens for expense", () => {
      const expenseTheme = getDirectionTheme("expense");
      expect(expenseTheme.textAccent).toBe("text-rose-400");
      expect(expenseTheme.amountPrefix).toBe("-");
      expect(expenseTheme.indicatorColor).toBe("rose");
    });
  });
});
