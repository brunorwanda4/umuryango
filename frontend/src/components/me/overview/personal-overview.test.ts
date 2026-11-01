import { describe, expect, it } from "bun:test";
import { addMinorUnits } from "./personal-overview-data";

describe("Personal Overview Data & Logic", () => {
  it("addMinorUnits performs integer/bigint minor unit addition without floating point loss", () => {
    // Large minor-unit numbers that would lose precision in JS float:
    const a = "9007199254740993"; // > Number.MAX_SAFE_INTEGER
    const b = "7";
    const total = addMinorUnits(a, b);
    expect(total).toBe(9007199254741000n);
  });

  it("handles null, undefined, and empty string safely in addMinorUnits", () => {
    const total = addMinorUnits("10000", null, undefined, "", "25000");
    expect(total).toBe(35000n);
  });

  it("calculates net balance exactly using bigint minor units", () => {
    const income = "145000000"; // 1,450,000.00 in minor units
    const expense = "62000000"; // 620,000.00 in minor units
    const balance = addMinorUnits(income) - addMinorUnits(expense);
    expect(balance).toBe(83000000n);
    expect(balance.toString()).toBe("83000000");
  });
});
