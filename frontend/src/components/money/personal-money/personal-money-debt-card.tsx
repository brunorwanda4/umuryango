import { PlusIcon } from "lucide-react";
import type { PersonalLoan } from "@/components/money/loans/types-and-schemas";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import { formatDisplayDate, formatFullRwf } from "./formatters";

export interface PersonalMoneyDebtCardProps {
  loan: PersonalLoan | null | undefined;
  currency: string;
  onAddLoan: () => void;
}

export function PersonalMoneyDebtCard({
  loan,
  currency,
  onAddLoan,
}: PersonalMoneyDebtCardProps) {
  const t = createTranslator("PersonalMoney");

  if (!loan) {
    return (
      <section className="flex flex-col justify-between rounded-[20px] border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-fraunces text-xl font-semibold text-foreground">
              {t("debtSnapshot.title")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("debtSnapshot.noDebts")}
          </p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLoan}
            className="rounded-full font-semibold"
          >
            <PlusIcon className="size-4" data-icon="inline-start" />
            {t("debtSnapshot.recordDebt")}
          </Button>
        </div>
      </section>
    );
  }

  const original = Math.max(1, Number(loan.originalAmountMinorUnits || 0));
  const paid = Number(loan.paidAmountMinorUnits || 0);
  const outstanding = Number(loan.remainingBalanceMinorUnits || 0);
  const pct = Math.min(100, Math.round((paid / original) * 100));

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-3.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-foreground">
            {t("debtSnapshot.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{loan.title}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <span className="size-1.5 rounded-full bg-current" />
          {loan.status === "ACTIVE" ? t("debtSnapshot.dueSoon") : loan.status}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between py-2 text-[15px]">
          <span className="text-muted-foreground">
            {t("debtSnapshot.party")}
          </span>
          <b className="font-semibold text-foreground">
            {loan.person?.name || t("debtSnapshot.familyLoan")}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">
            {t("debtSnapshot.originalLoan")}
          </span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(original, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">
            {t("debtSnapshot.paidSoFar")}
          </span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(paid, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">
            {t("debtSnapshot.outstanding")}
          </span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(outstanding, currency)}
          </b>
        </div>
        {loan.dueDate ? (
          <div className="flex justify-between border-t border-border py-2 text-[15px]">
            <span className="text-muted-foreground">
              {t("debtSnapshot.due")}
            </span>
            <b className="font-semibold text-foreground">
              {formatDisplayDate(loan.dueDate)}
            </b>
          </div>
        ) : null}
      </div>

      <div className="my-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-amber-600 transition-all dark:bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">{pct}% of the loan repaid</p>
    </section>
  );
}
