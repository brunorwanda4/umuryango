import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { DashboardQuickAddTile } from "@/components/common/dashboard/dashboard-action-grid";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "@/components/common/dashboard/dashboard-balance-card";
import { DashboardSummaryMetric } from "@/components/common/dashboard/dashboard-metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const cardClassName = "card card-border gap-0 rounded-[20px] py-5 shadow-sm";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
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
        />
        <DashboardBalanceStat
          href="/me/money/expenses"
          currency={data.currency}
          label={t((m) => m.PersonalOverview.summaryCards.spentThisMonth)}
          value={expenses}
        />
      </DashboardBalanceCard>

      <Card className={cardClassName}>
        <CardHeader className="px-5 pb-3.5">
          <CardTitle className="font-fraunces text-xl">
            {t((m) => m.PersonalOverview.summaryCards.quickAddTitle)}
          </CardTitle>
          <CardDescription>
            {t((m) => m.PersonalOverview.summaryCards.quickAddDesc)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
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
          <div className="grid gap-2.5 sm:grid-cols-2">
            <DashboardQuickAddTile
              href="/me/money/income"
              label={t((m) => m.PersonalOverview.summaryCards.addIncome)}
              icon={
                <ArrowDownLeftIcon
                  className="text-emerald-500"
                  aria-hidden="true"
                />
              }
            />
            <DashboardQuickAddTile
              href="/me/money/expenses"
              label={t((m) => m.PersonalOverview.summaryCards.addExpense)}
              icon={
                <ArrowUpRightIcon
                  className="text-destructive"
                  aria-hidden="true"
                />
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
