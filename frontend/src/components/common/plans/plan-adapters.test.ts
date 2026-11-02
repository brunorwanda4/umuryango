import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adaptFamilyProjectsSummary,
  adaptFamilyProjectToSharedItem,
} from "@/components/family/projects/family-projects-adapter";
import { adaptPersonPlanToSharedItem } from "@/components/plans/person-plans-adapter";
import type {
  PersonPlan,
  PersonPlanStatus,
} from "@/components/plans/types-and-schemas";

describe("adaptPersonPlanToSharedItem", () => {
  it("adapts a financial goal with accurate BigInt remaining and percentage", () => {
    const mockPlan: PersonPlan = {
      id: "plan-1",
      personId: "person-1",
      type: "LONG_TERM_GOAL",
      title: "Land Plot Downpayment",
      description: "Bugesera phase 1",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: null,
      dueDate: null,
      dueTime: null,
      targetDate: "2027-12-31",
      reminderAt: null,
      reminderFrequency: null,
      note: null,
      goalCategory: "Land",
      goalIcon: "🏡",
      needsMoney: true,
      targetAmountMinorUnits: "500000000",
      currentAmountMinorUnits: "120000000",
      currency: "RWF",
      progressMethod: "FINANCIAL",
      progress: 24,
      completedAt: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      milestones: [],
    };

    const actions = {
      onEdit: () => {},
      onDelete: () => {},
      onStatus: () => {},
      onView: () => {},
    };

    const item = adaptPersonPlanToSharedItem(mockPlan, actions);

    assert.equal(item.id, "plan-1");
    assert.equal(item.title, "Land Plot Downpayment");
    assert.equal(item.isFinancial, true);
    assert.equal(item.currentAmountMinorUnits, "120000000");
    assert.equal(item.targetAmountMinorUnits, "500000000");
    assert.equal(item.remainingAmountMinorUnits, "380000000");
    assert.equal(item.progressPercent, 24);
    assert.equal(item.iconEmoji, "🏡");
    assert.equal(item.taskCheckable, undefined);
    assert.equal(item.primaryAction?.label, "+ Save");
  });

  it("adapts a task with checkable toggle and line-through state", () => {
    const mockPlan: PersonPlan = {
      id: "task-1",
      personId: "person-1",
      type: "TASK",
      title: "Visit Bugesera plot site with surveyor",
      description: null,
      status: "COMPLETED",
      priority: "MEDIUM",
      startDate: null,
      dueDate: "2026-11-20",
      dueTime: null,
      targetDate: null,
      reminderAt: null,
      reminderFrequency: null,
      note: null,
      goalCategory: null,
      goalIcon: null,
      needsMoney: false,
      targetAmountMinorUnits: null,
      currentAmountMinorUnits: null,
      currency: "RWF",
      progressMethod: "MILESTONE",
      progress: 100,
      completedAt: "2026-11-01",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      milestones: [],
    };

    let calledPlan: PersonPlan | null = null;
    let calledStatus: PersonPlanStatus | null = null;
    const actions = {
      onEdit: () => {},
      onDelete: () => {},
      onStatus: (p: PersonPlan, s: PersonPlanStatus) => {
        calledPlan = p;
        calledStatus = s;
      },
      onView: () => {},
    };

    const item = adaptPersonPlanToSharedItem(mockPlan, actions);

    assert.ok(item.taskCheckable);
    assert.equal(item.taskCheckable?.checked, true);
    assert.equal(item.isCompleted, true);
    assert.equal(item.statusLabel, "Completed");

    // Toggle task
    item.taskCheckable?.onToggle();
    assert.equal(calledPlan ? (calledPlan as PersonPlan).id : "", "task-1");
    assert.equal(calledStatus, "IN_PROGRESS");
  });
});

describe("family projects adapters", () => {
  it("adapts a family project row to a SharedPlanItem", () => {
    const item = adaptFamilyProjectToSharedItem(
      {
        id: "proj-101",
        name: "Community Water Well",
        category: "Community",
        targetAmountMinorUnits: "10000000",
        contributedMinorUnits: "6000000",
        outstandingMinorUnits: "4000000",
        status: "active",
        targetDate: "2027-06-30",
        memberCount: 15,
      },
      "abanyarwanda",
      "RWF",
    );

    assert.equal(item.id, "proj-101");
    assert.equal(item.title, "Community Water Well");
    assert.equal(item.targetAmountMinorUnits, "10000000");
    assert.equal(item.currentAmountMinorUnits, "6000000");
    assert.equal(item.remainingAmountMinorUnits, "4000000");
    assert.equal(item.progressPercent, 60);
    assert.equal(item.memberCount, 15);
    assert.equal(
      item.href,
      "/family/abanyarwanda/projects/community-water-well",
    );
  });

  it("adapts overview totals into SharedPlanSummary safely with BigInt", () => {
    const summary = adaptFamilyProjectsSummary(
      {
        currency: "RWF",
        totals: {
          plannedMinorUnits: "20000000",
          contributedMinorUnits: "8000000",
          outstandingMinorUnits: "12000000",
          activeProjectCount: 3,
          overdueProjectCount: 1,
        },
        projects: [
          { id: "1", name: "A", status: "completed" },
          { id: "2", name: "B", status: "active" },
          { id: "3", name: "C", status: "active" },
        ],
      },
      "RWF",
    );

    assert.equal(summary.totalTargetMinorUnits, BigInt(20000000));
    assert.equal(summary.totalCurrentMinorUnits, BigInt(8000000));
    assert.equal(summary.totalRemainingMinorUnits, BigInt(12000000));
    assert.equal(summary.progressPercent, 40);
    assert.equal(summary.activeCount, 3);
    assert.equal(summary.completedCount, 1);
    assert.equal(summary.overdueCount, 1);
    assert.equal(summary.hasFinancials, true);
  });
});
