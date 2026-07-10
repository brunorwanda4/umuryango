import { LandmarkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { debtRecords, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import {
  formatDate,
  formatMoney,
  formatStatus,
  getStatusBadgeVariant,
} from "./utils";

export function DebtsTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Debts And Loans</CardTitle>
            <CardDescription>
              Monitor borrowed money, lent money, due dates, and outstanding
              balances.
            </CardDescription>
          </div>
          <MoneyFormDialog type="debt" />
        </CardHeader>
      </Card>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {debtRecords.map((debt) => (
          <Card key={debt.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{debt.title}</CardTitle>
                  <CardDescription>{debt.party}</CardDescription>
                </div>
                <LandmarkIcon className="shrink-0 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {debt.kind === "borrowed" ? "Borrowed" : "Lent"}
                </Badge>
                <Badge variant={getStatusBadgeVariant(debt.status)}>
                  {formatStatus(debt.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">Principal</p>
                  <p className="font-medium">
                    {formatMoney(debt.principalMinorUnits, moneyCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Outstanding</p>
                  <p className="font-medium">
                    {formatMoney(debt.outstandingMinorUnits, moneyCurrency)}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Due {formatDate(debt.dueDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
