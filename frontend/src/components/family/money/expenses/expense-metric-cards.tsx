import { CalendarDaysIcon, Clock3Icon, WalletCardsIcon } from "lucide-react";
import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { createTranslator } from "@/i18n/translate";
import type { ExpenseTransaction } from "./types-and-schemas";

const countedExpenseStatuses = new Set<ExpenseTransaction["status"]>([
  "APPROVED",
  "PENDING",
]);

export function ExpenseMetricCards({
  transactions,
  currency,
}: {
  transactions: ExpenseTransaction[];
  currency: string;
}) {
  const summary = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let totalExpenses = BigInt(0);
    let monthExpenses = BigInt(0);
    let todayExpenses = BigInt(0);
    let pendingApproval = BigInt(0);

    for (const transaction of transactions) {
      const amount = BigInt(transaction.amountMinorUnits);
      const txDate = new Date(transaction.date);
      const isCountedExpense = countedExpenseStatuses.has(transaction.status);
      const isThisMonth =
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;
      const isToday =
        txDate.getDate() === today.getDate() &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;

      if (isCountedExpense) {
        totalExpenses += amount;

        if (isThisMonth) {
          monthExpenses += amount;
        }

        if (isToday) {
          todayExpenses += amount;
        }
      }

      if (transaction.status === "PENDING") {
        pendingApproval += amount;
      }
    }

    return {
      totalExpenses: totalExpenses.toString(),
      monthExpenses: monthExpenses.toString(),
      todayExpenses: todayExpenses.toString(),
      pendingApproval: pendingApproval.toString(),
    };
  }, [transactions]);

  const t = createTranslator("FamilyExpenses");

  const cards = [
    {
      description: t((m) => m.FamilyExpenses.metrics.totalExpenses),
      value: <CompactMoney currency={currency} value={summary.totalExpenses} />,
      iconSource: {
        image: { src: "/images/icons/wallet.png" },
        line: WalletCardsIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyExpenses.metrics.expensesThisMonth),
      value: <CompactMoney currency={currency} value={summary.monthExpenses} />,
      iconSource: {
        image: { src: "/images/icons/expense.png" },
        line: CalendarDaysIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyExpenses.metrics.expensesToday),
      value: <CompactMoney currency={currency} value={summary.todayExpenses} />,
      iconSource: {
        image: { src: "/images/icons/money.png" },
        line: WalletCardsIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyExpenses.metrics.pendingApproval),
      value: (
        <CompactMoney currency={currency} value={summary.pendingApproval} />
      ),
      iconSource: {
        image: { src: "/images/icons/clock.png" },
        line: Clock3Icon,
      },
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
