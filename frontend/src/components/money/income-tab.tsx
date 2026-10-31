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
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <MoneyFormDialog type="income" />
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription={t("emptyDescription")}
          emptyTitle={t("emptyTitle")}
          records={incomeActivities}
          showType={false}
        />
      </CardContent>
    </Card>
  );
}
