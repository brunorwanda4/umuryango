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
import { formatMinorUnits } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

export function IncomeMetricCards({
  transactions,
  currency,
}: {
  transactions: IncomeTransaction[];
  currency: string;
}) {
  const summary = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalApproved = BigInt(0);
    let monthApproved = BigInt(0);
    let todayApproved = BigInt(0);
    let pendingAmount = BigInt(0);
    let approvedAmount = BigInt(0);

    for (const tx of transactions) {
      const amount = BigInt(tx.amountMinorUnits);
      const txDate = new Date(tx.date);

      if (tx.status === "APPROVED") {
        totalApproved += amount;
        approvedAmount += amount;

        // Month check
        if (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        ) {
          monthApproved += amount;
        }

        // Today check
        const txDateStr = tx.date.split("T")[0];
        if (txDateStr === todayStr) {
          todayApproved += amount;
        }
      } else if (tx.status === "PENDING") {
        pendingAmount += amount;
      }
    }

    return {
      totalApproved: totalApproved.toString(),
      monthApproved: monthApproved.toString(),
      todayApproved: todayApproved.toString(),
      pendingAmount: pendingAmount.toString(),
      approvedAmount: approvedAmount.toString(),
      recordCount: transactions.length,
    };
  }, [transactions]);

  return (
    <section
      aria-label="Income metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
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
            {formatMinorUnits(summary.totalApproved, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Sum of all approved records
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
            {formatMinorUnits(summary.monthApproved, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Approved this month
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
            {formatMinorUnits(summary.todayApproved, currency)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Approved today
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
            Income Records
          </CardDescription>
          <FileTextIcon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold truncate">
            {summary.recordCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Total records logged
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
