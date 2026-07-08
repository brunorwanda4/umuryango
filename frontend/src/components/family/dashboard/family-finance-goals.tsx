import { CreditCardIcon, PiggyBankIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MOCK_CONTRIBUTIONS,
  MOCK_DEBTS,
  MOCK_SAVINGS_GOALS,
} from "../money/mock-finance-data";
import type { AmountValue } from "./family-finance-helpers";

export function DemoGoalCards({
  formatAmount,
}: {
  formatAmount: (amount: AmountValue) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="size-5" /> Savings goals
          </CardTitle>
          <CardDescription>Track the family's future.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_SAVINGS_GOALS.map((goal) => {
            const progress = (goal.saved / goal.target) * 100;
            return (
              <div key={goal.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {formatAmount(goal.saved)} / {formatAmount(goal.target)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="size-5" /> Family contributions
          </CardTitle>
          <CardDescription>Active collections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_CONTRIBUTIONS.map((contribution) => {
            const progress = (contribution.paid / contribution.target) * 100;
            return (
              <div key={contribution.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 font-medium">
                    {contribution.name}
                  </span>
                  <span className="whitespace-nowrap text-muted-foreground font-mono">
                    {formatAmount(contribution.paid)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-muted-foreground text-xs">
                  Contributed by: {contribution.members.join(", ")}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5" /> Active debts
          </CardTitle>
          <CardDescription>Loans and money lent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_DEBTS.map((debt) => (
            <div
              key={debt.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-sm">{debt.name}</p>
                <p className="text-muted-foreground text-xs">
                  Due: {debt.dueDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{formatAmount(debt.amount)}</p>
                <Badge
                  variant={debt.type === "Borrowed" ? "destructive" : "default"}
                  className="mt-1 text-[10px]"
                >
                  {debt.type}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
