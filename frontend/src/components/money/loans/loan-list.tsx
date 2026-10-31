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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("PersonalLoans");

  if (loans.length === 0) {
    return (
      <Empty className="min-h-72 rounded-2xl border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HandCoinsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            {hasLoans ? t("tabs.noMatchingTitle") : t("tabs.noLoansTitle")}
          </EmptyTitle>
          <EmptyDescription>
            {hasLoans ? t("tabs.noMatchingDesc") : t("tabs.noLoansDesc")}
          </EmptyDescription>
        </EmptyHeader>
        {!hasLoans ? (
          <EmptyContent>
            <Button onClick={onAdd}>
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              {t("tabs.addFirstLoan")}
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
