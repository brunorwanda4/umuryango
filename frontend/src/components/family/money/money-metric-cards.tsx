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
      description: t("cashBalance"),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.cashBalanceMinorUnits}
        />
      ),
      iconImage: "/images/icons/wallet.png",
      link: moneyHref,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("income"),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.incomeMinorUnits}
        />
      ),
      iconImage: "/images/icons/income.png",
      link: `${moneyHref}/income`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("expenses"),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.expenseMinorUnits}
        />
      ),
      iconImage: "/images/icons/expense.png",
      link: `${moneyHref}/expenses`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("savings"),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.savingsMinorUnits}
        />
      ),
      iconImage: "/images/icons/savings.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("debts"),
      value: (
        <CompactMoney
          currency={currency}
          emptyLabel="No records"
          value={totals?.debtOutstandingMinorUnits}
        />
      ),
      iconImage: "/images/icons/debt.png",
      link: `${moneyHref}/loans`,
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
  ];

  return (
    <CommonOverviewCardDisplay
      className="grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5"
      cardHeaderClassName=" flex-col items-start justify-between gap-4 "
      cardDescriptionClassName="text-sm font-medium text-muted-foreground"
      cardTitleClassName="whitespace-normal leading-tight sm:text-2xl"
      iconPosition="start"
      cards={cards}
    />
  );
}
