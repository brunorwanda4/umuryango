import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { DashboardQuickAddTile } from "@/components/common/dashboard/dashboard-action-grid";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "@/components/common/dashboard/dashboard-balance-card";
import { DashboardSummaryMetric } from "@/components/common/dashboard/dashboard-metric-card";
import { Card } from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";

export function PersonalSummaryCards({ data }: { data: PersonalOverviewData }) {
  const t = createTranslator("PersonalOverview.summaryCards");
  const allIncome = data.income?.summary.allTimeTotalMinorUnits;
  const allExpenses = data.expenses?.summary.allTimeTotalMinorUnits;
  const balance = addMinorUnits(allIncome) - addMinorUnits(allExpenses);
  const income = data.income?.summary.periodTotalMinorUnits ?? "0";
  const expenses = data.expenses?.summary.periodTotalMinorUnits ?? "0";
  const activePlans = data.plans.filter(
    (plan) => plan.status === "PENDING" || plan.status === "IN_PROGRESS",
  ).length;
  const activeLoans = data.loans.filter(
    (loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE",
  ).length;
  const moneyAvailable = Boolean(data.income && data.expenses);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr] md:items-start">
      <DashboardBalanceCard
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
        />
        <DashboardBalanceStat
          href="/me/money/expenses"
          currency={data.currency}
          label={t((m) => m.PersonalOverview.summaryCards.spentThisMonth)}
          value={expenses}
          variant="expense"
        />
      </DashboardBalanceCard>

      <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between min-w-0">
        <div>
          <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
            {t((m) => m.PersonalOverview.summaryCards.quickAddTitle)}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {t((m) => m.PersonalOverview.summaryCards.quickAddDesc)}
          </p>
        </div>

        <div className="grid gap-3 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <DashboardSummaryMetric
              href="/me/plans"
              label={t((m) => m.PersonalOverview.summaryCards.activePlans)}
              value={activePlans}
            />
            <DashboardSummaryMetric
              href="/me/money/loans"
              label={t((m) => m.PersonalOverview.summaryCards.activeLoans)}
              value={activeLoans}
            />
            <DashboardSummaryMetric
              href="/family"
              label={t((m) => m.PersonalOverview.summaryCards.workspaces)}
              value={data.families.length}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <DashboardQuickAddTile
              href="/me/money/income"
              label={t((m) => m.PersonalOverview.summaryCards.addIncome)}
              description="Salary or deposit"
              icon={
                <ArrowDownLeftIcon
                  className="size-4 text-emerald-500"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-emerald-500/10 text-emerald-500"
            />
            <DashboardQuickAddTile
              href="/me/money/expenses"
              label={t((m) => m.PersonalOverview.summaryCards.addExpense)}
              description="Bills or supplies"
              icon={
                <ArrowUpRightIcon
                  className="size-4 text-rose-500"
                  aria-hidden="true"
                />
              }
              iconClassName="bg-rose-500/10 text-rose-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
