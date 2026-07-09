import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileTextIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  WalletCardsIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatMinorUnits } from "../utils";
import type { ExpenseTransaction } from "./types-and-schemas";

export function ExpenseMetricCards({
  transactions,
  currency,
}: {
  transactions: ExpenseTransaction[];
  currency: string;
}) {
  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalExpenses = BigInt(0);
    let monthExpenses = BigInt(0);
    let todayExpenses = BigInt(0);
    let pendingApproval = BigInt(0);
    let approvedExpenses = BigInt(0);
    let largestThisMonth = BigInt(0);

    for (const transaction of transactions) {
      const amount = BigInt(transaction.amountMinorUnits);
      const txDate = new Date(transaction.date);
      const isThisMonth =
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;

      if (transaction.status === "APPROVED") {
        totalExpenses += amount;
        approvedExpenses += amount;

        if (isThisMonth) {
          monthExpenses += amount;
          if (amount > largestThisMonth) largestThisMonth = amount;
        }

        if (transaction.date.split("T")[0] === today) {
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
      approvedExpenses: approvedExpenses.toString(),
      recordCount: transactions.length,
      largestThisMonth: largestThisMonth.toString(),
    };
  }, [transactions]);

  const cards = [
    {
      title: "Total Expenses",
      value: formatMinorUnits(summary.totalExpenses, currency),
      icon: WalletCardsIcon,
    },
    {
      title: "Expenses This Month",
      value: formatMinorUnits(summary.monthExpenses, currency),
      icon: TrendingDownIcon,
    },
    {
      title: "Expenses Today",
      value: formatMinorUnits(summary.todayExpenses, currency),
      icon: ReceiptTextIcon,
    },
    {
      title: "Pending Approval",
      value: formatMinorUnits(summary.pendingApproval, currency),
      icon: AlertCircleIcon,
    },
    {
      title: "Approved Expenses",
      value: formatMinorUnits(summary.approvedExpenses, currency),
      icon: CheckCircleIcon,
    },
    {
      title: "Expense Records",
      value: summary.recordCount.toString(),
      icon: FileTextIcon,
    },
    {
      title: "Largest This Month",
      value: formatMinorUnits(summary.largestThisMonth, currency),
      icon: TrendingDownIcon,
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
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardDescription className="font-medium text-[11px] uppercase tracking-wider">
                {card.title}
              </CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div  className="text-xl font-bold truncate">{card.value}</div>

            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
