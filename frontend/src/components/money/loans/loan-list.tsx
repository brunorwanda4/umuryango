import { HandCoinsIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { LoanItem } from "./loan-item";
import type { PersonalLoan } from "./types-and-schemas";

export function LoanList({
  loans,
  hasLoans,
  onAdd,
  onPayment,
  onView,
}: {
  loans: PersonalLoan[];
  hasLoans: boolean;
  onAdd: () => void;
  onPayment: (loan: PersonalLoan) => void;
  onView: (loan: PersonalLoan) => void;
}) {
  if (loans.length === 0) {
    return (
      <Empty className="min-h-72 rounded-2xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HandCoinsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            {hasLoans ? "No matching loans" : "No personal loans yet"}
          </EmptyTitle>
          <EmptyDescription>
            {hasLoans
              ? "Try changing the search or filters."
              : "Add a loan to track money borrowed from or lent to someone you trust."}
          </EmptyDescription>
        </EmptyHeader>
        {!hasLoans ? (
          <EmptyContent>
            <Button onClick={onAdd}>
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Add your first loan
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  }

  return (
    <ItemGroup>
      {loans.map((loan) => (
        <LoanItem
          key={loan.id}
          loan={loan}
          onPayment={onPayment}
          onView={onView}
        />
      ))}
    </ItemGroup>
  );
}
