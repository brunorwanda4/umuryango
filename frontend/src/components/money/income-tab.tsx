import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { incomeActivities, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { MoneyTable } from "./money-table";

export function IncomeTab() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Income History</CardTitle>
          <CardDescription>
            Track money received from work, business, contributions, gifts, and
            family support.
          </CardDescription>
        </div>
        <MoneyFormDialog type="income" />
      </CardHeader>
      <CardContent>
        <MoneyTable
          currency={moneyCurrency}
          emptyDescription="Income records will appear after a source is added."
          emptyTitle="No income yet"
          records={incomeActivities}
          showType={false}
        />
      </CardContent>
    </Card>
  );
}
