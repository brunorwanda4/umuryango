import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapFamilyLoanToSharedLoan } from "@/components/family/money/loans/family-loans-adapter";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import { mapPersonalLoanToSharedLoan } from "@/components/money/loans/personal-loans-adapter";
import type { PersonalLoan } from "@/components/money/loans/types-and-schemas";

describe("Loan Adapters", () => {
  it("mapPersonalLoanToSharedLoan maps PersonalLoan with accurate direction and actions", () => {
    let paymentCalledWith: PersonalLoan | null = null;
    let viewCalledWith: PersonalLoan | null = null;

    const mockPersonalLoan: PersonalLoan = {
      id: "pl-1",
      familyId: "fam-1",
      title: "Stock loan for shop",
      type: "LENT",
      person: {
        id: "p-1",
        name: "Claudine Mukamisha",
        relationship: "Cousin",
        phoneNumber: "0788123456",
      },
      originalAmountMinorUnits: "39000000",
      totalExpectedAmountMinorUnits: "39000000",
      paidAmountMinorUnits: "10000000",
      remainingBalanceMinorUnits: "29000000",
      currency: "RWF",
      startDate: "2026-01-01",
      dueDate: "2026-12-15",
      repaymentFrequency: "MONTHLY",
      interestRate: "0",
      category: { id: "cat-1", name: "Business" },
      notes: "Small business loan",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
    };

    const shared = mapPersonalLoanToSharedLoan(
      mockPersonalLoan,
      (loan) => {
        paymentCalledWith = loan;
      },
      (loan) => {
        viewCalledWith = loan;
      },
    );

    assert.equal(shared.id, "pl-1");
    assert.equal(shared.direction, "LENT");
    assert.equal(shared.counterpartyName, "Claudine Mukamisha");
    assert.equal(shared.counterpartyInitials, "CM");
    assert.ok(shared.counterpartySubtitle?.includes("Cousin"));
    assert.equal(shared.remainingAmountMinorUnits, "29000000");
    assert.equal(shared.currency, "RWF");

    // Primary action should record payment for active loan
    assert.ok(shared.primaryAction);
    shared.primaryAction.onClick();
    assert.equal(paymentCalledWith, mockPersonalLoan);

    // Card click should view details
    shared.onCardClick?.();
    assert.equal(viewCalledWith, mockPersonalLoan);
  });

  it("mapFamilyLoanToSharedLoan maps Family LoanRecord with role and management actions", () => {
    const actionCalls: Array<{ loanId: string; action: string }> = [];

    const mockFamilyLoan: LoanRecord = {
      id: "fl-1",
      familyId: "fam-1",
      title: "Laptop equipment SACCO loan",
      type: "MONEY_BORROWED",
      originalAmountMinorUnits: "36000000",
      paidAmountMinorUnits: "24000000",
      remainingBalanceMinorUnits: "12000000",
      currency: "RWF",
      startDate: "2026-01-01",
      dueDate: "2026-11-11",
      borrower: "Family Pot",
      lender: "Kigali Tech SACCO",
      paymentMethod: "SACCO_TRANSFER",
      repaymentFrequency: "MONTHLY",
      status: "ACTIVE",
      approvalStatus: "APPROVED",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const shared = mapFamilyLoanToSharedLoan(
      mockFamilyLoan,
      true, // canManageLoans
      (loan, action) => {
        actionCalls.push({ loanId: loan.id, action });
      },
    );

    assert.equal(shared.id, "fl-1");
    assert.equal(shared.direction, "BORROWED");
    assert.equal(shared.counterpartyName, "Kigali Tech SACCO");
    assert.equal(shared.counterpartyInitials, "KS");
    assert.equal(shared.remainingAmountMinorUnits, "12000000");

    // Manager should have repayment as primary action
    assert.ok(shared.primaryAction);
    shared.primaryAction.onClick();
    assert.deepEqual(actionCalls[0], { loanId: "fl-1", action: "repayment" });

    // Menu actions should contain management items
    assert.ok(shared.menuActions);
    const actionLabels = shared.menuActions.map((a) => a.label);
    assert.ok(actionLabels.length >= 3);
  });
});
