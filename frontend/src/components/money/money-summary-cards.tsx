import {
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  PiggyBankIcon,
  WalletCardsIcon,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MoneySummary } from "./types";
import { formatMoney } from "./utils";

interface MoneySummaryCardsProps {
  currency: string;
  summary: MoneySummary;
}

export function MoneySummaryCards({
  currency,
  summary,
}: MoneySummaryCardsProps) {
  const cards = [
    {
      description: "Total income",
      icon: ArrowDownIcon,
      title: formatMoney(summary.totalIncomeMinorUnits, currency),
    },
    {
      description: "Total expenses",
      icon: ArrowUpIcon,
      title: formatMoney(summary.totalExpensesMinorUnits, currency),
    },
    {
      description: "Balance",
      icon: WalletCardsIcon,
      title: formatMoney(summary.balanceMinorUnits, currency),
    },
    {
      description: "Savings",
      icon: PiggyBankIcon,
      title: formatMoney(summary.savingsMinorUnits, currency),
    },
    {
      description: "Debts",
      icon: LandmarkIcon,
      title: formatMoney(summary.debtsMinorUnits, currency),
    },
  ];

  return (
    <section
      aria-label="Money summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.description}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.description}</CardDescription>
                <CardTitle className="truncate text-2xl">
                  {card.title}
                </CardTitle>
              </div>
              <Icon className="shrink-0 text-muted-foreground" />
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
