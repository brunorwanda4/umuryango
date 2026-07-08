import {
  AlertCircleIcon,
  CheckCircleIcon,
  CoinsIcon,
  FileTextIcon,
  TrendingDownIcon,
  WalletIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatMinorUnits, normalizeMinorUnitString } from "../utils";
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

  return (
    <section
      aria-label="Income metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Total Income
          </CardDescription>
          <WalletIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.totalRecorded, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Approved and pending records
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Income This Month
          </CardDescription>
          <CoinsIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.monthRecorded, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Recorded this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Income Today
          </CardDescription>
          <TrendingDownIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.todayRecorded, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Recorded today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Pending Income
          </CardDescription>
          <AlertCircleIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.pendingAmount, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Requires validation
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Approved Income
          </CardDescription>
          <CheckCircleIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.approvedAmount, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Verified & completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Rent Balance
          </CardDescription>
          <AlertCircleIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {formatMinorUnits(summary.rentBalance, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Remaining monthly rent
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Overdue Rent
          </CardDescription>
          <FileTextIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {summary.overdueRentCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Monthly records past due
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            Income Records
          </CardDescription>
          <FileTextIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {summary.recordCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Active records logged
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
