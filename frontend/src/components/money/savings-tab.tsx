import { PiggyBankIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";
import { moneyCurrency, savingsGoals } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { formatDate, formatStatus, getProgressPercent } from "./utils";

export function SavingsTab() {
  const t = createTranslator("PersonalMoney.legacyTabs.savings");
  const tCommon = createTranslator("PersonalMoney");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              {t((m) => m.PersonalMoney.legacyTabs.savings.title)}
            </CardTitle>
            <CardDescription>
              {t((m) => m.PersonalMoney.legacyTabs.savings.description)}
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
                    <p className="text-muted-foreground text-sm">
                      {t((m) => m.PersonalMoney.legacyTabs.savings.saved)}
                    </p>
                    <p className="font-semibold text-xl">
                      <CompactMoney
                        currency={moneyCurrency}
                        value={goal.savedMinorUnits}
                      />
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
                    <span>
                      {tCommon((m) => m.PersonalMoney.percentComplete, {
                        percent: progress,
                      })}
                    </span>
                    <span>
                      {t((m) => m.PersonalMoney.legacyTabs.savings.target)}{" "}
                      <CompactMoney
                        currency={moneyCurrency}
                        value={goal.targetMinorUnits}
                      />
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  {tCommon((m) => m.PersonalMoney.due, {
                    date: formatDate(goal.dueDate),
                  })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
