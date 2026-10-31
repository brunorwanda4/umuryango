import { Calendar, Pen, PiggyBankIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { createTranslator } from "@/i18n/translate";
import CommonOverviewCardDisplay from "../common/overview-card-display";
import type { MoneySummary } from "./types";

interface MoneySummaryCardsProps {
  currency: string;
  summary: MoneySummary;
}

const MeMoneyIncomeCard = ({ currency, summary }: MoneySummaryCardsProps) => {
  const t = createTranslator("PersonalMoney.personalIncome");
  const iconClassName = "size-5 shrink-0 text-muted-foreground";
  const cards = [
    {
      description: t((m) => m.PersonalMoney.personalIncome.summary.totalIncome),
      // icon: <ArrowDownIcon className={iconClassName} />,
      iconImage: "/images/icons/money.png",
      value: (
        <CompactMoney
          currency={currency}
          value={summary.totalIncomeMinorUnits}
        />
      ),
    },
    {
      description: t(
        (m) => m.PersonalMoney.personalIncome.summary.incomeTransactions,
      ),
      icon: <Pen className={iconClassName} />,
      value: 90,
    },

    {
      description: t((m) => m.PersonalMoney.personalIncome.summary.thisMonth),
      icon: <Calendar className={iconClassName} />,
      value: 9000,
    },
    {
      description: t(
        (m) => m.PersonalMoney.personalIncome.summary.largestIncome,
      ),
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
