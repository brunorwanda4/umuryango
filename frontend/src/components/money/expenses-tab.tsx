import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { expenseActivities, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { MoneyTable } from "./money-table";

export function ExpensesTab() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            Keep family and personal spending organized by category, date, and
            account.
          </CardDescription>
        </div>
        <MoneyFormDialog type="expense" />
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription="Expense records will appear after money spent is added."
          emptyTitle="No expenses yet"
          records={expenseActivities}
          showType={false}
        />
      </CardContent>
    </Card>
  );
}
