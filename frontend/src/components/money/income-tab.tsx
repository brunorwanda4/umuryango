import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { incomeActivities, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { MoneyTable } from "./money-table";

export function IncomeTab() {
  const t = createTranslator("PersonalMoney.legacyTabs.income");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>
            {t((m) => m.PersonalMoney.legacyTabs.income.title)}
          </CardTitle>
          <CardDescription>
            {t((m) => m.PersonalMoney.legacyTabs.income.description)}
          </CardDescription>
        </div>
        <MoneyFormDialog type="income" />
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription={t(
            (m) => m.PersonalMoney.legacyTabs.income.emptyDescription,
          )}
          emptyTitle={t((m) => m.PersonalMoney.legacyTabs.income.emptyTitle)}
          records={incomeActivities}
          showType={false}
        />
      </CardContent>
    </Card>
  );
}
