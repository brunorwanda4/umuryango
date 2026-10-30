import {
  CoinsIcon,
  LandmarkIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactRwf } from "./formatters";

export interface PersonalMoneyOverviewCardsProps {
  loading?: boolean;
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalSavings: number;
  totalDebt: number;
}

export function PersonalMoneyOverviewCards({
  loading = false,
  currency,
  totalIncome,
  totalExpenses,
  balance,
  totalSavings,
  totalDebt,
}: PersonalMoneyOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Skeleton className="h-24 rounded-[18px]" />
        <Skeleton className="h-24 rounded-[18px]" />
        <Skeleton className="col-span-2 h-24 rounded-[20px] lg:col-span-1" />
        <Skeleton className="h-24 rounded-[18px]" />
        <Skeleton className="h-24 rounded-[18px]" />
      </div>
    );
  }

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="text-sm font-medium leading-5 text-muted-foreground"
      cardHeaderClassName="min-h-40 flex-col items-start justify-between gap-4 py-5"
      cardTitleClassName="whitespace-normal leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-5"
      iconPosition="start"
      cards={[
        {
          className: "border-border/80 py-0 shadow-sm",
          description: "Total income",
          iconSource: {
            image: { src: "/images/icons/income.png" },
            line: TrendingDownIcon,
          },
          link: "/me/money/income",
          value: formatCompactRwf(totalIncome, currency),
        },
        {
          className: "border-border/80 py-0 shadow-sm",
          description: "Total expenses",
          iconSource: {
            image: { src: "/images/icons/expense.png" },
            line: TrendingUpIcon,
          },
          link: "/me/money/expenses",
          value: formatCompactRwf(totalExpenses, currency),
        },
        {
          className: "border-border/80 py-0 shadow-sm",
          description: "Balance",
          iconSource: {
            image: { src: "/images/icons/wallet.png" },
            line: WalletCardsIcon,
          },
          link: "/me/money",
          value: formatCompactRwf(balance, currency),
        },
        {
          className: "border-border/80 py-0 shadow-sm",
          description: "Savings",
          iconSource: {
            image: { src: "/images/icons/savings.png" },
            line: CoinsIcon,
          },
          link: "/me/savings",
          value: formatCompactRwf(totalSavings, currency),
        },
        {
          className: "border-border/80 py-0 shadow-sm",
          description: "Debts",
          iconSource: {
            image: { src: "/images/icons/debt.png" },
            line: LandmarkIcon,
          },
          link: "/me/debts",
          value: formatCompactRwf(totalDebt, currency),
        },
      ]}
    />
  );
}
