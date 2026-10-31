import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import {
  debtRecords,
  moneyCurrency,
  moneySummary,
  recentActivities,
  savingsGoals,
} from "./money-data";
import { MoneySummaryCards } from "./money-summary-cards";
import { MoneyTable } from "./money-table";
import { formatDate, getProgressPercent } from "./utils";

export function MoneyOverview() {
  const t = createTranslator("PersonalMoney.legacyTabs.overview");
  const tCommon = createTranslator("PersonalMoney");
  const nextSavingsGoal = savingsGoals[0];
  const nextDebt = debtRecords[0];

  return (
    <div className="flex flex-col gap-4">
      <MoneySummaryCards currency={moneyCurrency} summary={moneySummary} />
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>
              {t((m) => m.PersonalMoney.legacyTabs.overview.recentTransactions)}
            </CardTitle>
            <CardDescription>
              {t(
                (m) =>
                  m.PersonalMoney.legacyTabs.overview.recentTransactionsDesc,
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyTable
              currency={moneyCurrency}
              emptyDescription={t(
                (m) => m.PersonalMoney.legacyTabs.overview.emptyDescription,
              )}
              emptyTitle={t(
                (m) => m.PersonalMoney.legacyTabs.overview.emptyTitle,
              )}
              records={recentActivities.slice(0, 5)}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t((m) => m.PersonalMoney.legacyTabs.overview.nextSavingsGoal)}
              </CardTitle>
              <CardDescription>{nextSavingsGoal.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {t((m) => m.PersonalMoney.legacyTabs.overview.saved)}
                </span>
                <span className="font-medium">
                  <CompactMoney
                    currency={moneyCurrency}
                    value={nextSavingsGoal.savedMinorUnits}
                  />
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {t((m) => m.PersonalMoney.legacyTabs.overview.target)}
                </span>
                <span className="font-medium">
                  <CompactMoney
                    currency={moneyCurrency}
                    value={nextSavingsGoal.targetMinorUnits}
                  />
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {tCommon((m) => m.PersonalMoney.progress)}
                </span>
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
              <CardTitle>
                {tCommon((m) => m.PersonalMoney.debtSnapshot)}
              </CardTitle>
              <CardDescription>{nextDebt.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {tCommon((m) => m.PersonalMoney.party)}
                </span>
                <span className="font-medium">{nextDebt.party}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {tCommon((m) => m.PersonalMoney.outstanding)}
                </span>
                <span className="font-medium">
                  <CompactMoney
                    currency={moneyCurrency}
                    value={nextDebt.outstandingMinorUnits}
                  />
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {tCommon((m) => m.PersonalMoney.due, {
                    date: formatDate(nextDebt.dueDate),
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
