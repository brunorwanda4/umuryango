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
        <CardTitle>
          {t((m) => m.PersonalMoney.legacyTabs.transactions.title)}
        </CardTitle>
        <CardDescription>
          {t((m) => m.PersonalMoney.legacyTabs.transactions.description)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription={t(
            (m) => m.PersonalMoney.legacyTabs.transactions.emptyDescription,
          )}
          emptyTitle={t(
            (m) => m.PersonalMoney.legacyTabs.transactions.emptyTitle,
          )}
          records={recentActivities}
        />
      </CardContent>
    </Card>
  );
}
