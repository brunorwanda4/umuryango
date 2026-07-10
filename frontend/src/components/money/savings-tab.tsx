import { PiggyBankIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { moneyCurrency, savingsGoals } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import {
  formatDate,
  formatMoney,
  formatStatus,
  getProgressPercent,
} from "./utils";

export function SavingsTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>
              Follow goals for emergencies, education, projects, and planned
              family events.
            </CardDescription>
          </div>
          <MoneyFormDialog type="savings" />
        </CardHeader>
      </Card>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {savingsGoals.map((goal) => {
          const progress = getProgressPercent(
            goal.savedMinorUnits,
            goal.targetMinorUnits,
          );

          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{goal.title}</CardTitle>
                    <CardDescription>{goal.category}</CardDescription>
                  </div>
                  <PiggyBankIcon className="shrink-0 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Saved</p>
                    <p className="font-semibold text-xl">
                      {formatMoney(goal.savedMinorUnits, moneyCurrency)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      goal.status === "settled" ? "default" : "secondary"
                    }
                  >
                    {formatStatus(goal.status)}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Progress value={progress} />
                  <div className="flex justify-between gap-3 text-muted-foreground text-xs">
                    <span>{progress}% complete</span>
                    <span>
                      Target {formatMoney(goal.targetMinorUnits, moneyCurrency)}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Due {formatDate(goal.dueDate)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
