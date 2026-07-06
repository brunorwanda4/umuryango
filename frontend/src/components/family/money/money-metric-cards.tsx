import {
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
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
  familySlug,
}: {
  currency: string;
  money: MoneyOverview | null;
  familySlug: string;
}) {
  const totals = money?.totals;
  const moneyHref = `/family/${encodeURIComponent(familySlug)}/money`;
  const cards = [
    {
      title: "Cash balance",
      value: totals?.cashBalanceMinorUnits,
      description: "Server-approved family position",
      icon: WalletCardsIcon,
      link: moneyHref,
    },
    {
      title: "Income",
      value: totals?.incomeMinorUnits,
      description: "Approved money received",
      icon: ArrowDownIcon,
      link: `${moneyHref}/income`,
    },
    {
      title: "Expenses",
      value: totals?.expenseMinorUnits,
      description: "Approved money spent",
      icon: ArrowUpIcon,
      link: `${moneyHref}/expenses`,
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
      link: `${moneyHref}/loans`,
    },
  ];

  return (
    <section
      aria-label="Family money summary"
      className="grid gap-4 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const cardContent = (
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
        if (card.link) {
          return (
            <Link key={card.title} href={card.link}>
              {cardContent}
            </Link>
          );
        }
        return cardContent;
      })}
    </section>
  );
}
