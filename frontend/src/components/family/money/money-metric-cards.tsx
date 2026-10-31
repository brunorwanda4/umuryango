import {
  CoinsIcon,
  LandmarkIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyMoney");
  const totals = money?.totals;
  const moneyHref = `/family/${encodeURIComponent(familySlug)}/money`;
  const cards = [
    {
      description: t((m) => m.FamilyMoney.cashBalance),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.cashBalanceMinorUnits}
        />
      ),
      iconSource: {
        image: { src: "/images/icons/wallet.png" },
        line: WalletCardsIcon,
      },
      link: moneyHref,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyMoney.income),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.incomeMinorUnits}
        />
      ),
      iconSource: {
        image: { src: "/images/icons/income.png" },
        line: TrendingDownIcon,
      },
      link: `${moneyHref}/income`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyMoney.expenses),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.expenseMinorUnits}
        />
      ),
      iconSource: {
        image: { src: "/images/icons/expense.png" },
        line: TrendingUpIcon,
      },
      link: `${moneyHref}/expenses`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyMoney.savings),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.savingsMinorUnits}
        />
      ),
      iconSource: {
        image: { src: "/images/icons/savings.png" },
        line: CoinsIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyMoney.debts),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.debtOutstandingMinorUnits}
        />
      ),
      iconSource: {
        image: { src: "/images/icons/debt.png" },
        line: LandmarkIcon,
      },
      link: `${moneyHref}/loans`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
  ];

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
      cardHeaderClassName="flex-col items-start justify-between gap-4 py-4"
      cardTitleClassName="whitespace-normal leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      iconPosition="start"
      cards={cards}
    />
  );
}
