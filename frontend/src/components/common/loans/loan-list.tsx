import type { ReactNode } from "react";
import { LoanCardItem } from "./loan-card-item";
import { LoanEmptyState } from "./loan-empty-state";
import type { SharedLoan } from "./types";

export function LoanList({
  loans,
  hasLoans,
  onAdd,
  onResetFilters,
  emptySlot,
}: {
  loans: SharedLoan[];
  hasLoans: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
  emptySlot?: ReactNode;
}) {
  if (loans.length === 0) {
    return (
      <LoanEmptyState
        hasLoans={hasLoans}
        onAdd={onAdd}
        onResetFilters={onResetFilters}
        customSlot={emptySlot}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {loans.map((loan) => (
        <LoanCardItem key={loan.id} loan={loan} />
      ))}
    </div>
  );
}
