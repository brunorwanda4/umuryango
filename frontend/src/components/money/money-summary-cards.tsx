import {
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  PiggyBankIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import type { MoneySummary } from "./types";

interface MoneySummaryCardsProps {
  currency: string;
  summary: MoneySummary;
}

export function MoneySummaryCards({
  currency,
  summary,
}: MoneySummaryCardsProps) {
  const t = createTranslator("PersonalMoney.legacyTabs.summaryCards");

  const cards = [
    {
      description: t("totalIncome"),
      icon: ArrowDownIcon,
      value: summary.totalIncomeMinorUnits,
    },
    {
      description: t("totalExpenses"),
      icon: ArrowUpIcon,
      value: summary.totalExpensesMinorUnits,
    },
    {
      description: t("balance"),
      icon: WalletCardsIcon,
      value: summary.balanceMinorUnits,
    },
    {
      description: t("savings"),
      icon: PiggyBankIcon,
      value: summary.savingsMinorUnits,
    },
    {
      description: t("debts"),
      icon: LandmarkIcon,
      value: summary.debtsMinorUnits,
    },
  ];

  return (
    <section
      aria-label="Money summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.description}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.description}</CardDescription>
                <CardTitle className="truncate text-2xl">
                  <CompactMoney currency={currency} value={card.value} />
                </CardTitle>
              </div>
              <Icon className="shrink-0 text-muted-foreground" />
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
