import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { moneyCurrency, recentActivities } from "./money-data";
import { MoneyTable } from "./money-table";

export function TransactionsTab() {
  const t = createTranslator("PersonalMoney.legacyTabs.transactions");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription={t("emptyDescription")}
          emptyTitle={t("emptyTitle")}
          records={recentActivities}
        />
      </CardContent>
    </Card>
  );
}
