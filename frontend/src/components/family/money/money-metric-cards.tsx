import {
  ArrowDownIcon,
  ArrowUpIcon,
  HandCoinsIcon,
  LandmarkIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MoneyOverview } from "./types";
import { formatOptionalMoney } from "./utils";

export function MoneyMetricCards({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = [
    {
      title: "Cash balance",
      value: totals?.cashBalanceMinorUnits,
      description: "Server-approved family position",
      icon: WalletCardsIcon,
    },
    {
      title: "Income",
      value: totals?.incomeMinorUnits,
      description: "Approved money received",
      icon: ArrowDownIcon,
    },
    {
      title: "Expenses",
      value: totals?.expenseMinorUnits,
      description: "Approved money spent",
      icon: ArrowUpIcon,
    },
    {
      title: "Contributions",
      value: totals?.contributionsPaidMinorUnits,
      description: "Paid family commitments",
      icon: HandCoinsIcon,
    },
    {
      title: "Savings",
      value: totals?.savingsMinorUnits,
      description: "Saved toward family goals",
      icon: TargetIcon,
    },
    {
      title: "Debts",
      value: totals?.debtOutstandingMinorUnits,
      description: "Outstanding borrowed or lent money",
      icon: LandmarkIcon,
    },
  ];

  return (
    <section
      aria-label="Family money summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-xl">
                  {formatOptionalMoney(card.value, currency)}
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs leading-5">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
