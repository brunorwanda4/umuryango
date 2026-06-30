import { ListChecksIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { clampPercent, formatOptionalMoney } from "./utils";

export function MoneyBudgetList({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const budgets = money?.budgets ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>
          Category limits compared with approved source records.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {budgets.length ? (
          budgets.map((budget) => (
            <div
              key={budget.id ?? budget.categoryName}
              className="rounded-2xl border p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{budget.categoryName}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatOptionalMoney(budget.spentMinorUnits, currency)} of{" "}
                    {formatOptionalMoney(budget.limitMinorUnits, currency)}
                  </p>
                </div>
                <StatusBadge value={budget.status ?? "tracking"} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(budget.percentUsed)} />
                <p className="text-muted-foreground text-xs">
                  {typeof budget.percentUsed === "number"
                    ? `${Math.round(budget.percentUsed)}% used`
                    : "Usage percent must come from the API."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <TableEmptyState
            icon={ListChecksIcon}
            title="No budgets returned"
            description="Approved budget periods and category limits will appear here after they are saved."
          />
        )}
      </CardContent>
    </Card>
  );
}
