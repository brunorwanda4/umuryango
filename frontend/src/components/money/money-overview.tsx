import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  debtRecords,
  moneyCurrency,
  moneySummary,
  recentActivities,
  savingsGoals,
} from "./money-data";
import { MoneySummaryCards } from "./money-summary-cards";
import { MoneyTable } from "./money-table";
import { formatDate, formatMoney, getProgressPercent } from "./utils";

export function MoneyOverview() {
  const nextSavingsGoal = savingsGoals[0];
  const nextDebt = debtRecords[0];

  return (
    <div className="flex flex-col gap-4">
      <MoneySummaryCards currency={moneyCurrency} summary={moneySummary} />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest money activity across personal and family records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyTable
              currency={moneyCurrency}
              emptyDescription="Recent transactions will appear after records are added."
              emptyTitle="No recent transactions"
              records={recentActivities.slice(0, 5)}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Savings Goal</CardTitle>
              <CardDescription>{nextSavingsGoal.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Saved</span>
                <span className="font-medium">
                  {formatMoney(nextSavingsGoal.savedMinorUnits, moneyCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Target</span>
                <span className="font-medium">
                  {formatMoney(nextSavingsGoal.targetMinorUnits, moneyCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {getProgressPercent(
                    nextSavingsGoal.savedMinorUnits,
                    nextSavingsGoal.targetMinorUnits,
                  )}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Debt Snapshot</CardTitle>
              <CardDescription>{nextDebt.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Party</span>
                <span className="font-medium">{nextDebt.party}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-medium">
                  {formatMoney(nextDebt.outstandingMinorUnits, moneyCurrency)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Due</span>
                <span className="font-medium">
                  {formatDate(nextDebt.dueDate)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
