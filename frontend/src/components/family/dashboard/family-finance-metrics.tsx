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

export function FinanceMetricCards({
  currency,
  formatAmount,
  isDemo,
  money,
}: {
  currency: string;
  formatAmount: (amount: AmountValue) => string;
  isDemo: boolean;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = isDemo
    ? [
        {
          title: "Total family balance",
          value: MOCK_SUMMARY.totalBalance,
          description: "Demo balance for dashboard preview",
          icon: WalletIcon,
        },
        {
          title: "Monthly income",
          value: MOCK_SUMMARY.monthlyIncome,
          description: "Across demo income sources",
          icon: ArrowUpIcon,
        },
        {
          title: "Monthly expenses",
          value: MOCK_SUMMARY.monthlyExpenses,
          description: "Demo spending snapshot",
          icon: ArrowDownIcon,
        },
        {
          title: "Total savings",
          value: MOCK_SUMMARY.totalSavings,
          description: "Demo active goals",
          icon: PiggyBankIcon,
        },
      ]
    : [
        {
          title: "Cash balance",
          value: totals?.cashBalanceMinorUnits,
          description: "Server-approved family position",
          icon: WalletIcon,
        },
        {
          title: "Income",
          value: totals?.incomeMinorUnits,
          description: "Approved money received",
          icon: ArrowUpIcon,
        },
        {
          title: "Expenses",
          value: totals?.expenseMinorUnits,
          description: "Approved money spent",
          icon: ArrowDownIcon,
        },
        {
          title: "Savings",
          value: totals?.savingsMinorUnits,
          description: `Saved in ${currency}`,
          icon: PiggyBankIcon,
        },
      ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="font-medium text-sm">
                {card.title}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatAmount(card.value)}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

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
