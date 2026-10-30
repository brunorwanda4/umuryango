import { ArrowDownIcon, Calendar, Pen, PiggyBankIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "../common/overview-card-display";
import type { MoneySummary } from "./types";

interface MoneySummaryCardsProps {
  currency: string;
  summary: MoneySummary;
}

const MeMoneyIncomeCard = ({ currency, summary }: MoneySummaryCardsProps) => {
  const iconClassName = "size-5 shrink-0 text-muted-foreground";
  const cards = [
    {
      description: "Total income",
      // icon: <ArrowDownIcon className={iconClassName} />,
      iconImage: "/images/icons/money.png",
      value: <CompactMoney currency={currency} value={summary.totalIncomeMinorUnits} />,
    },
    {
      description: "Income Transactions",
      icon: <Pen className={iconClassName} />,
      value: 90,
    },

    {
      description: "This Month's",
      icon: <Calendar className={iconClassName} />,
      value: 9000,
    },
    {
      description: "Largest Income",
      icon: <PiggyBankIcon className={iconClassName} />,
      value: 9000,
    },
  ];
  return (
    <section className="mt-4" aria-label="Income summary">
      <CommonOverviewCardDisplay cards={cards} />
    </section>
  );
};

export default MeMoneyIncomeCard;
