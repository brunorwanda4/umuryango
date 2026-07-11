import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileTextIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  WalletCardsIcon,
} from "lucide-react";
import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const cards = [
    {
      title: "Total Expenses",
      value: summary.totalExpenses,
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: "Expenses This Month",
      value: summary.monthExpenses,
      icon: TrendingDownIcon,
      isMoney: true,
    },
    {
      title: "Expenses Today",
      value: summary.todayExpenses,
      icon: ReceiptTextIcon,
      isMoney: true,
    },
    {
      title: "Pending Approval",
      value: summary.pendingApproval,
      icon: AlertCircleIcon,
      isMoney: true,
    },
    {
      title: "Approved Expenses",
      value: summary.approvedExpenses,
      icon: CheckCircleIcon,
      isMoney: true,
    },
    {
      title: "Expense Records",
      value: summary.recordCount.toString(),
      icon: FileTextIcon,
    },
    {
      title: "Largest This Month",
      value: summary.largestThisMonth,
      icon: TrendingDownIcon,
      isMoney: true,
    },
  ];

  return (
    <section
      aria-label="Expense metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex sm:flex-row flex-row-reverse items-center justify-end sm:justify-between gap-3">
              <div className="min-w-0 max-sm:flex-row max-sm:flex max-sm:items-center max-sm:gap-4">
                <CardDescription className="max-sm:font-semibold max-sm:text-lg max-sm:flex">
                  <span>{card.title}</span>{" "}
                  <span className="block sm:hidden">:</span>
                </CardDescription>
                <CardTitle className="mt-1 truncate text-xl sm:text-2xl font-bold">
                  {card.isMoney ? (
                    <CompactMoney currency={currency} value={card.value} />
                  ) : (
                    card.value
                  )}
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground sm:block hidden" />
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
