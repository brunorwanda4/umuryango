import { describe, expect, it } from "bun:test";
import {
  addMinorUnits,
  getDirectionTheme,
  normalizeMinorUnits,
  safeCalculatePercentage,
} from "./money-section-utils";

describe("Shared Money-Direction Presentation & Safety", () => {
  it("enforces positive inflow semantics and emerald token classes for income", () => {
    const theme = getDirectionTheme("income");
    expect(theme.amountPrefix).toBe("+");
    expect(theme.textAccent).toBe("text-emerald-400");
    expect(theme.indicatorColor).toBe("emerald");
    expect(theme.bgAccentSubtle).toContain("emerald");
  });

  it("enforces negative outflow semantics and rose token classes for expenses", () => {
    const theme = getDirectionTheme("expense");
    expect(theme.amountPrefix).toBe("-");
    expect(theme.textAccent).toBe("text-rose-400");
    expect(theme.indicatorColor).toBe("rose");
    expect(theme.bgAccentSubtle).toContain("rose");
  });

  it("prevents floating-point precision loss when aggregating transaction totals", () => {
    // 0.1 + 0.2 in float is 0.30000000000000004
    // In minor units: 10 + 20 = 30
    const total = addMinorUnits("10", "20");
    expect(total).toBe("30");

    const huge1 = "5000000000000000";
    const huge2 = "3000000000000000";
    expect(addMinorUnits(huge1, huge2)).toBe("8000000000000000");
  });

  it("never produces NaN, infinity, or crash when dividing by zero in percentages", () => {
    expect(safeCalculatePercentage("5000", "0")).toBe(0);
    expect(safeCalculatePercentage("0", "0")).toBe(0);
    expect(safeCalculatePercentage("-5000", "10000")).toBe(0);
    expect(safeCalculatePercentage("15000", "10000")).toBe(100);
  });

  it("safely normalizes missing or non-integer string amounts", () => {
    expect(normalizeMinorUnits(null)).toBe("0");
    expect(normalizeMinorUnits(undefined)).toBe("0");
    expect(normalizeMinorUnits("")).toBe("0");
    expect(normalizeMinorUnits("1250000")).toBe("1250000");
    expect(normalizeMinorUnits("1250000.45")).toBe("1250000");
  });

  it("verifies budget usage calculation logic", () => {
    const totalBudget = "5000000"; // 50,000 RWF in minor units
    const spentAmount = "3500000"; // 35,000 RWF
    const usagePercent = safeCalculatePercentage(spentAmount, totalBudget);
    expect(usagePercent).toBe(70);
  });
});
