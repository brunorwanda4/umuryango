import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculatePlanSummary,
  filterSharedPlans,
  formatTargetTimeline,
  getCategoryEmoji,
} from "./plan-calculations";
import type { SharedPlanItem } from "./types";

describe("Plan Calculations & Helpers", () => {
  it("getCategoryEmoji maps common keywords to matching emojis", () => {
    assert.equal(getCategoryEmoji("vehicle", "Buy RAV4"), "🚗");
    assert.equal(
      getCategoryEmoji("real estate", "Land plot downpayment"),
      "🏡",
    );
    assert.equal(getCategoryEmoji("health", "Emergency fund"), "🛡️");
    assert.equal(getCategoryEmoji("education", "Exam cert"), "🎓");
    assert.equal(getCategoryEmoji("other", "General goal"), "🎯");
  });

  it("calculatePlanSummary aggregates BigInt financial numbers without precision loss", () => {
    const items: SharedPlanItem[] = [
      {
        id: "1",
        title: "Car Purchase",
        isFinancial: true,
        targetAmountMinorUnits: "12000000",
        currentAmountMinorUnits: "5400000",
        remainingAmountMinorUnits: "6600000",
        currency: "RWF",
        progressPercent: 45,
        status: "ACTIVE",
        statusLabel: "Active",
      },
      {
        id: "2",
        title: "Emergency Buffer",
        isFinancial: true,
        targetAmountMinorUnits: "2000000",
        currentAmountMinorUnits: "1650000",
        remainingAmountMinorUnits: "350000",
        currency: "RWF",
        progressPercent: 82,
        status: "ACTIVE",
        statusLabel: "Active",
      },
      {
        id: "3",
        title: "Exam Fee",
        isFinancial: true,
        targetAmountMinorUnits: "800000",
        currentAmountMinorUnits: "800000",
        remainingAmountMinorUnits: "0",
        currency: "RWF",
        progressPercent: 100,
        status: "COMPLETED",
        statusLabel: "Completed",
        isCompleted: true,
      },
      {
        id: "4",
        title: "Simple Task",
        isFinancial: false,
        currency: "RWF",
        progressPercent: 0,
        status: "ACTIVE",
        statusLabel: "Active",
        isOverdue: true,
      },
    ];

    const summary = calculatePlanSummary(items, "RWF");

    assert.equal(summary.hasFinancials, true);
    // 12M + 2M + 0.8M = 14,800,000
    assert.equal(summary.totalTargetMinorUnits, BigInt(14800000));
    // 5.4M + 1.65M + 0.8M = 7,850,000
    assert.equal(summary.totalCurrentMinorUnits, BigInt(7850000));
    // 6.6M + 0.35M = 6,950,000
    assert.equal(summary.totalRemainingMinorUnits, BigInt(6950000));
    assert.equal(summary.activeCount, 3);
    assert.equal(summary.completedCount, 1);
    assert.equal(summary.overdueCount, 1);
    // 7,850,000 * 100 / 14,800,000 = 53%
    assert.equal(summary.progressPercent, 53);
  });

  it("calculatePlanSummary handles task-only plans gracefully", () => {
    const items: SharedPlanItem[] = [
      {
        id: "1",
        title: "Task 1",
        isFinancial: false,
        currency: "RWF",
        progressPercent: 0,
        status: "ACTIVE",
        statusLabel: "Active",
      },
      {
        id: "2",
        title: "Task 2",
        isFinancial: false,
        currency: "RWF",
        progressPercent: 100,
        status: "COMPLETED",
        statusLabel: "Completed",
        isCompleted: true,
      },
    ];

    const summary = calculatePlanSummary(items, "RWF");

    assert.equal(summary.hasFinancials, false);
    assert.equal(summary.totalTargetMinorUnits, BigInt(0));
    assert.equal(summary.activeCount, 1);
    assert.equal(summary.completedCount, 1);
    // 1 of 2 completed = 50%
    assert.equal(summary.progressPercent, 50);
  });

  it("formatTargetTimeline outputs human friendly relative date", () => {
    const refDate = new Date("2026-11-02T12:00:00Z");

    const today = formatTargetTimeline("2026-11-02T12:00:00Z", false, refDate);
    assert.equal(today.label, "Due today");
    assert.equal(today.isOverdue, false);

    const future = formatTargetTimeline("2026-11-15T12:00:00Z", false, refDate);
    assert.ok(future.label.includes("Due in 13 days"));
    assert.equal(future.isOverdue, false);

    const past = formatTargetTimeline("2026-10-25T12:00:00Z", false, refDate);
    assert.ok(past.label.includes("Overdue by 8 days"));
    assert.equal(past.isOverdue, true);

    const completed = formatTargetTimeline(
      "2026-10-25T12:00:00Z",
      true,
      refDate,
    );
    assert.ok(completed.label.startsWith("Completed"));
    assert.equal(completed.isOverdue, false);
  });

  it("filterSharedPlans filters by tab and search", () => {
    const items: SharedPlanItem[] = [
      {
        id: "1",
        title: "Car Purchase (RAV4)",
        category: "savings",
        isFinancial: true,
        currency: "RWF",
        progressPercent: 45,
        status: "ACTIVE",
        statusLabel: "Active",
      },
      {
        id: "2",
        title: "Call surveyor for land",
        category: "tasks",
        isFinancial: false,
        currency: "RWF",
        progressPercent: 0,
        status: "ACTIVE",
        statusLabel: "Active",
      },
    ];

    const savingsOnly = filterSharedPlans(items, "", "savings");
    assert.equal(savingsOnly.length, 1);
    assert.equal(savingsOnly[0].id, "1");

    const tasksOnly = filterSharedPlans(items, "", "tasks");
    assert.equal(tasksOnly.length, 1);
    assert.equal(tasksOnly[0].id, "2");

    const searchMatch = filterSharedPlans(items, "surveyor", "all");
    assert.equal(searchMatch.length, 1);
    assert.equal(searchMatch[0].id, "2");
  });
});
