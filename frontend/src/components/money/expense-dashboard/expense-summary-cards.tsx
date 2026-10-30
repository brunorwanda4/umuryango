import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  TrophyIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";

export function ExpenseSummaryCards({
  summary,
}: {
  summary: {
    allTimeTotalMinorUnits: string;
    transactionCount: number;
    largestExpense: {
      amountMinorUnits: string;
      category: string;
      description: string | null;
    } | null;
    periodTotalMinorUnits: string;
  };
}) {
  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
      cardHeaderClassName="flex-col items-start justify-between gap-4 py-4"
      cardTitleClassName="whitespace-normal leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      iconPosition="start"
      cards={[
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Total expenses",
          iconSource: {
            image: { src: "/images/icons/wallet.png" },
            line: WalletCardsIcon,
          },
          value: (
            <CompactMoney
              currency="RWF"
              value={summary.allTimeTotalMinorUnits}
            />
          ),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Expense transactions",
          iconSource: {
            image: { src: "/images/icons/transaction.png" },
            line: ArrowUpRightIcon,
          },
          value: summary.transactionCount.toString(),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "This month's",
          iconSource: {
            image: { src: "/images/icons/calendar.png" },
            line: CalendarDaysIcon,
          },
          value: (
            <CompactMoney
              currency="RWF"
              value={summary.periodTotalMinorUnits}
            />
          ),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Largest expense",
          iconSource: {
            image: { src: "/images/icons/quality.png" },
            line: TrophyIcon,
          },
          value: (
            <CompactMoney
              currency="RWF"
              emptyLabel="No records"
              value={summary.largestExpense?.amountMinorUnits}
            />
          ),
        },
      ]}
    />
  );
}
