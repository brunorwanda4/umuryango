import { PlusIcon } from "lucide-react";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "@/components/common/dashboard/dashboard-balance-card";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";

export function PersonalSummaryCards({
  data,
  onSuccess,
}: {
  data: PersonalOverviewData;
  onSuccess: () => void | Promise<void>;
}) {
  const t = createTranslator("PersonalOverview.summaryCards");
  const allIncome = data.income?.summary.allTimeTotalMinorUnits;
  const allExpenses = data.expenses?.summary.allTimeTotalMinorUnits;
  const balance = addMinorUnits(allIncome) - addMinorUnits(allExpenses);
  const income = data.income?.summary.periodTotalMinorUnits ?? "0";
  const expenses = data.expenses?.summary.periodTotalMinorUnits ?? "0";
  const moneyAvailable = Boolean(data.income && data.expenses);

  return (
    <div className="w-full">
      <DashboardBalanceCard
        className="w-full"
        label={t((m) => m.PersonalOverview.summaryCards.totalBalance, {
          currency: data.currency,
        })}
        currency={data.currency}
        value={moneyAvailable ? balance.toString() : 0}
        href="/me/money"
        unavailable={!moneyAvailable}
        unavailableLabel={t(
          (m) => m.PersonalOverview.summaryCards.moneyUnavailable,
        )}
      >
        <DashboardBalanceStat
          href="/me/money/income"
          currency={data.currency}
          label={t((m) => m.PersonalOverview.summaryCards.incomeThisMonth)}
          value={income}
          variant="income"
          action={
            data.personalWorkspaceId ? (
              <MoneyFormDialog
                categories={data.categories}
                familyId={data.personalWorkspaceId}
                onCategoryCreated={onSuccess}
                onSuccess={onSuccess}
                type="income"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    aria-label={t(
                      (m) => m.PersonalOverview.summaryCards.addIncome,
                    )}
                    className="rounded-full"
                  >
                    <PlusIcon aria-hidden="true" />
                  </Button>
                }
              />
            ) : null
          }
        />
        <DashboardBalanceStat
          href="/me/money/expenses"
          currency={data.currency}
          label={t((m) => m.PersonalOverview.summaryCards.spentThisMonth)}
          value={expenses}
          variant="expense"
          action={
            data.personalWorkspaceId ? (
              <MoneyFormDialog
                categories={data.categories}
                familyId={data.personalWorkspaceId}
                onCategoryCreated={onSuccess}
                onSuccess={onSuccess}
                type="expense"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    aria-label={t(
                      (m) => m.PersonalOverview.summaryCards.addExpense,
                    )}
                    className=" rounded-full"
                  >
                    <PlusIcon aria-hidden="true" />
                  </Button>
                }
              />
            ) : null
          }
        />
      </DashboardBalanceCard>
    </div>
  );
}
