import {
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MoneyOverview } from "./types";

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
      icon: WalletCardsIcon,
      link: moneyHref,
    },
    {
      title: "Income",
      value: totals?.incomeMinorUnits,
      icon: ArrowDownIcon,
      link: `${moneyHref}/income`,
    },
    {
      title: "Expenses",
      value: totals?.expenseMinorUnits,
      icon: ArrowUpIcon,
      link: `${moneyHref}/expenses`,
    },
    {
      title: "Savings",
      value: totals?.savingsMinorUnits,
      icon: TargetIcon,
    },
    {
      title: "Debts",
      value: totals?.debtOutstandingMinorUnits,
      icon: LandmarkIcon,
      link: `${moneyHref}/loans`,
    },
  ];

  return (
    <section
      aria-label="Family money summary"
      className="grid gap-3 grid-cols-1 lg:grid-cols-4 2xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const cardContent = (
          <Card key={card.title}>
            <CardHeader className="flex sm:flex-row flex-row-reverse items-center justify-end sm:justify-between gap-3 ">
              <div className="min-w-0 max-sm:flex-row max-sm:flex max-sm:items-center max-sm:gap-4">
                <CardDescription className=" max-sm:font-semibold max-sm:text-lg max-sm:flex">
                  <span>{card.title}</span>{" "}
                  <span className=" block sm:hidden">:</span>
                </CardDescription>
                <CardTitle className="mt-1 truncate text-xl sm:text-2xl font-bold ">
                  <CompactMoney
                    currency={currency}
                    emptyLabel="No records"
                    value={card.value}
                  />
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground sm:block hidden" />
            </CardHeader>
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
