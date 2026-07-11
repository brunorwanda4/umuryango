import {
  AlertCircleIcon,
  CheckCircleIcon,
  CoinsIcon,
  FileTextIcon,
  TrendingDownIcon,
  WalletIcon,
} from "lucide-react";
import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeMinorUnitString } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecordDateKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    return dateMatch[0];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateKey(date);
}

function getMinorUnits(value: unknown) {
  return BigInt(normalizeMinorUnitString(value) ?? "0");
}

export function IncomeMetricCards({
  transactions,
  currency,
}: {
  transactions: IncomeTransaction[];
  currency: string;
}) {
  const summary = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const currentMonthKey = todayKey.slice(0, 7);

    let totalRecorded = BigInt(0);
    let monthRecorded = BigInt(0);
    let todayRecorded = BigInt(0);
    let pendingAmount = BigInt(0);
    let approvedAmount = BigInt(0);
    let rentBalance = BigInt(0);
    let overdueRentCount = 0;
    let activeRecordCount = 0;

    for (const tx of transactions) {
      if (tx.status === "REJECTED" || tx.status === "REVERSED") {
        continue;
      }

      activeRecordCount += 1;

      const amount = getMinorUnits(tx.amountMinorUnits);
      const txDateKey = getRecordDateKey(tx.date);
      totalRecorded += amount;

      if (tx.incomeRecurrence === "MONTHLY" && tx.expectedAmountMinorUnits) {
        const expectedAmount = getMinorUnits(tx.expectedAmountMinorUnits);
        const remaining = expectedAmount - amount;

        if (remaining > BigInt(0)) {
          rentBalance += remaining;
        }

        const dueDateKey = getRecordDateKey(tx.dueDate);
        if (dueDateKey && remaining > BigInt(0) && dueDateKey < todayKey) {
          overdueRentCount += 1;
        }
      }

      if (txDateKey?.startsWith(currentMonthKey)) {
        monthRecorded += amount;
      }

      if (txDateKey === todayKey) {
        todayRecorded += amount;
      }

      if (tx.status === "APPROVED") {
        approvedAmount += amount;
      } else if (tx.status === "PENDING") {
        pendingAmount += amount;
      }
    }

    return {
      totalRecorded: totalRecorded.toString(),
      monthRecorded: monthRecorded.toString(),
      todayRecorded: todayRecorded.toString(),
      pendingAmount: pendingAmount.toString(),
      approvedAmount: approvedAmount.toString(),
      rentBalance: rentBalance.toString(),
      overdueRentCount,
      recordCount: activeRecordCount,
    };
  }, [transactions]);

  const cards = [
    {
      title: "Total Income",
      value: summary.totalRecorded,
      icon: WalletIcon,
      isMoney: true,
    },
    {
      title: "Income This Month",
      value: summary.monthRecorded,
      icon: CoinsIcon,
      isMoney: true,
    },
    {
      title: "Income Today",
      value: summary.todayRecorded,
      icon: TrendingDownIcon,
      isMoney: true,
    },
    {
      title: "Pending Income",
      value: summary.pendingAmount,
      icon: AlertCircleIcon,
      isMoney: true,
    },
    {
      title: "Approved Income",
      value: summary.approvedAmount,
      icon: CheckCircleIcon,
      isMoney: true,
    },
    {
      title: "Rent Balance",
      value: summary.rentBalance,
      icon: AlertCircleIcon,
      isMoney: true,
    },
    {
      title: "Overdue Rent",
      value: String(summary.overdueRentCount),
      icon: FileTextIcon,
    },
    {
      title: "Income Records",
      value: String(summary.recordCount),
      icon: FileTextIcon,
    },
  ];

  return (
    <section
      aria-label="Income metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
