import {
  ArrowDownIcon,
  ArrowUpIcon,
  CreditCardIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_SUMMARY } from "../money/mock-finance-data";
import type { MoneyOverview } from "../money/types";
import type { AmountValue } from "./family-finance-helpers";

export function PersistedFinanceCards({
  currency,
  formatAmount,
  money,
}: {
  currency: string;
  formatAmount: (amount: AmountValue) => string;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = [
    {
      title: "Savings",
      value: totals?.savingsMinorUnits,
      description: `Saved toward family goals in ${currency}.`,
      icon: PiggyBankIcon,
    },
    {
      title: "Contributions",
      value: totals?.contributionsPaidMinorUnits,
      description: "Paid family commitments from approved records.",
      icon: TrendingUpIcon,
    },
    {
      title: "Outstanding debts",
      value: totals?.debtOutstandingMinorUnits,
      description: "Borrowed or lent money still being tracked.",
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-5" />
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-2xl">{formatAmount(card.value)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
