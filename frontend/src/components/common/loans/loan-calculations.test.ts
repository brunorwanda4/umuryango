import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateLoanSummary,
  filterSharedLoans,
  formatDueTimeline,
  getInitials,
} from "./loan-calculations";
import type { SharedLoan, SharedLoanFiltersState } from "./types";

describe("Loan Calculations & Mapping Helpers", () => {
  it("getInitials extracts uppercase initials properly", () => {
    assert.equal(getInitials("Jean-Paul Nsengiyumva"), "JN");
    assert.equal(getInitials("Claudine"), "CL");
    assert.equal(getInitials("   "), "?");
    assert.equal(getInitials("Kigali Tech SACCO"), "KS");
  });

  it("calculateLoanSummary computes BigInt sums and ratio accurately without precision loss", () => {
    const mockLoans: SharedLoan[] = [
      {
        id: "1",
        title: "Loan to JP",
        direction: "LENT",
        counterpartyName: "Jean-Paul",
        counterpartyInitials: "JP",
        originalAmountMinorUnits: "5000000",
        paidAmountMinorUnits: "1000000",
        remainingAmountMinorUnits: "4000000",
        currency: "RWF",
        dueDate: "2026-12-01",
        status: "ACTIVE",
        statusLabel: "Active",
        progressPercent: 20,
        isOverdue: false,
      },
      {
        id: "2",
        title: "Borrow from SACCO",
        direction: "BORROWED",
        counterpartyName: "Kigali SACCO",
        counterpartyInitials: "KS",
        originalAmountMinorUnits: "2000000",
        paidAmountMinorUnits: "500000",
        remainingAmountMinorUnits: "1500000",
        currency: "RWF",
        dueDate: "2026-11-15",
        status: "OVERDUE",
        statusLabel: "Overdue",
        progressPercent: 25,
        isOverdue: true,
      },
      {
        id: "3",
        title: "Completed loan",
        direction: "LENT",
        counterpartyName: "Claudine",
        counterpartyInitials: "CM",
        originalAmountMinorUnits: "3000000",
        paidAmountMinorUnits: "3000000",
        remainingAmountMinorUnits: "0",
        currency: "RWF",
        dueDate: "2026-01-01",
        status: "REPAID",
        statusLabel: "Repaid",
        progressPercent: 100,
        isOverdue: false,
      },
    ];

    const summary = calculateLoanSummary(mockLoans, "RWF");

    assert.equal(summary.totalLentRemainingMinorUnits, BigInt(4000000));
    assert.equal(summary.totalBorrowedRemainingMinorUnits, BigInt(1500000));
    assert.equal(summary.netBalanceMinorUnits, BigInt(2500000));
    assert.equal(summary.activeCount, 2);
    assert.equal(summary.lentCount, 1);
    assert.equal(summary.borrowedCount, 1);
    assert.equal(summary.overdueCount, 1);

    // Exposure = 4,000,000 + 1,500,000 = 5,500,000
    // Lent % = 4000000 * 100 / 5500000 = 72%
    assert.equal(summary.lentRatioPercent, 72);
    assert.equal(summary.borrowedRatioPercent, 28);
  });

  it("calculateLoanSummary handles empty loan list safely", () => {
    const summary = calculateLoanSummary([], "RWF");
    assert.equal(summary.totalLentRemainingMinorUnits, BigInt(0));
    assert.equal(summary.totalBorrowedRemainingMinorUnits, BigInt(0));
    assert.equal(summary.netBalanceMinorUnits, BigInt(0));
    assert.equal(summary.activeCount, 0);
    assert.equal(summary.overdueCount, 0);
    assert.equal(summary.lentRatioPercent, 50);
    assert.equal(summary.borrowedRatioPercent, 50);
  });

  it("formatDueTimeline formats relative dates accurately", () => {
    const refDate = new Date("2026-11-02T12:00:00Z");

    const todayDue = formatDueTimeline("2026-11-02T12:00:00Z", false, refDate);
    assert.equal(todayDue.label, "Due today");
    assert.equal(todayDue.isOverdue, false);

    const in3Days = formatDueTimeline("2026-11-05T12:00:00Z", false, refDate);
    assert.ok(in3Days.label.includes("Due in 3 days"));
    assert.equal(in3Days.isOverdue, false);

    const overdue = formatDueTimeline("2026-10-30T12:00:00Z", false, refDate);
    assert.ok(overdue.label.includes("Overdue by 3 days"));
    assert.equal(overdue.isOverdue, true);

    const settled = formatDueTimeline("2026-10-30T12:00:00Z", true, refDate);
    assert.ok(settled.label.startsWith("Settled"));
    assert.equal(settled.isOverdue, false);
  });

  it("filterSharedLoans filters by direction, status, search, and counterparty", () => {
    const loans: SharedLoan[] = [
      {
        id: "1",
        title: "School Fees Loan",
        direction: "LENT",
        counterpartyName: "Jean-Paul",
        counterpartyInitials: "JP",
        counterpartyContactId: "c1",
        originalAmountMinorUnits: "5000000",
        paidAmountMinorUnits: "0",
        remainingAmountMinorUnits: "5000000",
        currency: "RWF",
        dueDate: "2026-12-01",
        status: "ACTIVE",
        statusLabel: "Active",
        progressPercent: 0,
        isOverdue: false,
      },
      {
        id: "2",
        title: "Equipment Micro-loan",
        direction: "BORROWED",
        counterpartyName: "Kigali SACCO",
        counterpartyInitials: "KS",
        counterpartyContactId: "c2",
        originalAmountMinorUnits: "2000000",
        paidAmountMinorUnits: "500000",
        remainingAmountMinorUnits: "1500000",
        currency: "RWF",
        dueDate: "2026-10-01",
        status: "OVERDUE",
        statusLabel: "Overdue",
        progressPercent: 25,
        isOverdue: true,
      },
    ];

    const filterLent: SharedLoanFiltersState = {
      search: "",
      direction: "LENT",
      status: "all",
      counterpartyId: "all",
    };
    assert.equal(filterSharedLoans(loans, filterLent).length, 1);
    assert.equal(filterSharedLoans(loans, filterLent)[0].id, "1");

    const filterSearch: SharedLoanFiltersState = {
      search: "SACCO",
      direction: "all",
      status: "all",
      counterpartyId: "all",
    };
    assert.equal(filterSharedLoans(loans, filterSearch).length, 1);
    assert.equal(filterSharedLoans(loans, filterSearch)[0].id, "2");

    const filterOverdue: SharedLoanFiltersState = {
      search: "",
      direction: "all",
      status: "OVERDUE",
      counterpartyId: "all",
    };
    assert.equal(filterSharedLoans(loans, filterOverdue).length, 1);
    assert.equal(filterSharedLoans(loans, filterOverdue)[0].id, "2");
  });
});
