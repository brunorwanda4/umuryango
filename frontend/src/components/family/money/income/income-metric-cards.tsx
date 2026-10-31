import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  Clock3Icon,
  WalletCardsIcon,
} from "lucide-react";
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
    let pendingAmount = BigInt(0);
    let activeRecordCount = 0;

    for (const tx of transactions) {
      if (tx.status === "REJECTED" || tx.status === "REVERSED") {
        continue;
      }

      activeRecordCount += 1;

      const amount = getMinorUnits(tx.amountMinorUnits);
      const txDateKey = getRecordDateKey(tx.date);
      totalRecorded += amount;

      if (txDateKey?.startsWith(currentMonthKey)) {
        monthRecorded += amount;
      }

      if (tx.status === "PENDING") {
        pendingAmount += amount;
      }
    }

    return {
      totalRecorded: totalRecorded.toString(),
      monthRecorded: monthRecorded.toString(),
      pendingAmount: pendingAmount.toString(),
      recordCount: activeRecordCount,
    };
  }, [transactions]);

  const t = createTranslator("FamilyIncome");

  const cards = [
    {
      description: t((m) => m.FamilyIncome.metrics.totalIncome),
      value: <CompactMoney currency={currency} value={summary.totalRecorded} />,
      iconSource: {
        image: { src: "/images/icons/wallet.png" },
        line: WalletCardsIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyIncome.metrics.incomeThisMonth),
      value: <CompactMoney currency={currency} value={summary.monthRecorded} />,
      iconSource: {
        image: { src: "/images/icons/income.png" },
        line: CalendarDaysIcon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyIncome.metrics.pendingIncome),
      value: <CompactMoney currency={currency} value={summary.pendingAmount} />,
      iconSource: {
        image: { src: "/images/icons/clock.png" },
        line: Clock3Icon,
      },
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
    },
    {
      description: t((m) => m.FamilyIncome.metrics.incomeRecords),
      value: String(summary.recordCount),
      iconSource: {
        image: { src: "/images/icons/transaction.png" },
        line: ArrowUpRightIcon,
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
