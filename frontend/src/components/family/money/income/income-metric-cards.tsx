import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { createTranslator } from "@/i18n/translate";
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

  const t = createTranslator("FamilyIncome");

  const cards = [
    {
      description: t("metrics.totalIncome"),
      value: <CompactMoney currency={currency} value={summary.totalRecorded} />,
      iconImage: "/images/icons/wallet.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.incomeThisMonth"),
      value: <CompactMoney currency={currency} value={summary.monthRecorded} />,
      iconImage: "/images/icons/income.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.incomeToday"),
      value: <CompactMoney currency={currency} value={summary.todayRecorded} />,
      iconImage: "/images/icons/money.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.pendingIncome"),
      value: <CompactMoney currency={currency} value={summary.pendingAmount} />,
      iconImage: "/images/icons/clock.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.approvedIncome"),
      value: (
        <CompactMoney currency={currency} value={summary.approvedAmount} />
      ),
      iconImage: "/images/icons/approved.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.rentBalance"),
      value: <CompactMoney currency={currency} value={summary.rentBalance} />,
      iconImage: "/images/icons/salary.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.overdueRent"),
      value: String(summary.overdueRentCount),
      iconImage: "/images/icons/calendar.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t("metrics.incomeRecords"),
      value: String(summary.recordCount),
      iconImage: "/images/icons/transaction.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
  ];

  return (
    <CommonOverviewCardDisplay
      className="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      cardHeaderClassName="min-h-36 flex-col items-start justify-between gap-4 "
      cardDescriptionClassName="text-sm font-medium text-muted-foreground"
      cardTitleClassName="whitespace-normal leading-tight sm:text-2xl"
      iconPosition="start"
      cards={cards}
    />
  );
}
