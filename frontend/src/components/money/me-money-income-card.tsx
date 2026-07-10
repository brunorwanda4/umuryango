import {
  ArrowDownIcon,
  ArrowUpIcon,
  Calendar,
  LandmarkIcon,
  Pen,
  PiggyBankIcon,
  WalletCardsIcon,
} from "lucide-react";
import CommonOverviewCardDisplay from "../common/overview-card-display";
import type { MoneySummary } from "./types";
import { formatMoney } from "./utils";

interface MoneySummaryCardsProps {
  currency: string;
  summary: MoneySummary;
}

const MeMoneyIncomeCard = ({ currency, summary }: MoneySummaryCardsProps) => {
  const iconClassName = "size-5 shrink-0 text-muted-foreground";
  const cards = [
    {
      description: "Total income",
      icon: <ArrowDownIcon className={iconClassName} />,
      value: formatMoney(summary.totalIncomeMinorUnits, currency),
    },
    {
      description: "Income Transactions",
      icon: <Pen className={iconClassName} />,
      value: 90,
    },

    {
      description: "This Month's Income",
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
