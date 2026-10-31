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
    let approvedExpenses = BigInt(0);
    let largestThisMonth = BigInt(0);

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
          if (amount > largestThisMonth) largestThisMonth = amount;
        }

        if (isToday) {
          todayExpenses += amount;
        }
      }

      if (transaction.status === "APPROVED") {
        approvedExpenses += amount;
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
      approvedExpenses: approvedExpenses.toString(),
      recordCount: transactions.length,
      largestThisMonth: largestThisMonth.toString(),
    };
  }, [transactions]);

  const t = createTranslator("FamilyExpenses");

  const cards = [
    {
      description: t("metrics.totalExpenses"),
      value: <CompactMoney currency={currency} value={summary.totalExpenses} />,
      iconImage: "/images/icons/wallet.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.expensesThisMonth"),
      value: <CompactMoney currency={currency} value={summary.monthExpenses} />,
      iconImage: "/images/icons/expense.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.expensesToday"),
      value: <CompactMoney currency={currency} value={summary.todayExpenses} />,
      iconImage: "/images/icons/money.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.pendingApproval"),
      value: (
        <CompactMoney currency={currency} value={summary.pendingApproval} />
      ),
      iconImage: "/images/icons/clock.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.approvedExpenses"),
      value: (
        <CompactMoney currency={currency} value={summary.approvedExpenses} />
      ),
      iconImage: "/images/icons/approved.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.expenseRecords"),
      value: summary.recordCount.toString(),
      iconImage: "/images/icons/transaction.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.largestThisMonth"),
      value: (
        <CompactMoney currency={currency} value={summary.largestThisMonth} />
      ),
      iconImage: "/images/icons/quality.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
  ];

  return (
    <CommonOverviewCardDisplay
      className="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
      cardHeaderClassName="min-h-36 flex-col items-start justify-between gap-4 "
      cardDescriptionClassName="text-sm font-medium text-muted-foreground"
      cardTitleClassName="whitespace-normal leading-tight sm:text-2xl"
      iconPosition="start"
      cards={cards}
    />
  );
}
