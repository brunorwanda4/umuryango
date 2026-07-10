import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { moneyCurrency, recentActivities } from "./money-data";
import { MoneyTable } from "./money-table";

export function TransactionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>
          View income, expenses, savings transfers, debt activity, and
          repayments together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription="All money activity will show here once records are connected."
          emptyTitle="No transactions yet"
          records={recentActivities}
        />
      </CardContent>
    </Card>
  );
}
