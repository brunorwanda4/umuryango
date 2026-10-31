import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { expenseActivities, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { MoneyTable } from "./money-table";

export function ExpensesTab() {
  const t = createTranslator("PersonalMoney.legacyTabs.expenses");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>
            {t((m) => m.PersonalMoney.legacyTabs.expenses.title)}
          </CardTitle>
          <CardDescription>
            {t((m) => m.PersonalMoney.legacyTabs.expenses.description)}
          </CardDescription>
        </div>
        <MoneyFormDialog type="expense" />
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription={t(
            (m) => m.PersonalMoney.legacyTabs.expenses.emptyDescription,
          )}
          emptyTitle={t((m) => m.PersonalMoney.legacyTabs.expenses.emptyTitle)}
          records={expenseActivities}
          showType={false}
        />
      </CardContent>
    </Card>
  );
}
