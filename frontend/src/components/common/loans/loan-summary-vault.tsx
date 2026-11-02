import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { SharedLoanDirection, SharedLoanSummary } from "./types";

export function LoanSummaryVault({
  summary,
  onSelectTab,
  isPersonal = true,
}: {
  summary: SharedLoanSummary;
  onSelectTab?: (direction: SharedLoanDirection) => void;
  isPersonal?: boolean;
}) {
  const t = createTranslator("SharedLoans");
  const isNetPositive = summary.netBalanceMinorUnits > BigInt(0);
  const isNetNegative = summary.netBalanceMinorUnits < BigInt(0);
  const totalExposure =
    summary.totalLentRemainingMinorUnits +
    summary.totalBorrowedRemainingMinorUnits;

  const lentLabel = isPersonal
    ? t((m) => m.SharedLoans.owedToYou)
    : t((m) => m.SharedLoans.owedToFamily);
  const borrowedLabel = isPersonal
    ? t((m) => m.SharedLoans.youOwe)
    : t((m) => m.SharedLoans.familyOwes);

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 transition-colors">
      {/* Top Header: Net Position Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-border">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            {t((m) => m.SharedLoans.netCreditExposure)}
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-mono">
              {isNetPositive ? "+" : ""}
              <CompactMoney
                currency={summary.currency}
                value={summary.netBalanceMinorUnits.toString()}
              />
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                isNetPositive && "text-emerald-600 dark:text-emerald-400",
                isNetNegative && "text-rose-600 dark:text-rose-400",
                !isNetPositive && !isNetNegative && "text-muted-foreground",
              )}
            >
              {isNetPositive
                ? `(${t((m) => m.SharedLoans.netAsset)})`
                : isNetNegative
                  ? `(${t((m) => m.SharedLoans.netDebt)})`
                  : `(${t((m) => m.SharedLoans.settled)})`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          {summary.overdueCount > 0 ? (
            <Badge variant="destructive" className="text-[10px] font-medium">
              {t((m) => m.SharedLoans.overdueCount, {
                count: summary.overdueCount,
              })}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="text-[10px] font-medium">
            {t((m) => m.SharedLoans.activeContracts, {
              count: summary.activeCount,
            })}
          </Badge>
        </div>
      </div>

      {/* Split Vault Columns: Lent vs Borrowed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5">
        {/* Lent Box */}
        <button
          type="button"
          onClick={() => onSelectTab?.("LENT")}
          className={cn(
            "p-3.5 rounded-xl border border-border bg-muted/30 text-left transition",
            "hover:bg-muted/50 hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{lentLabel}</span>
            </span>
            <ArrowUpRightIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            <CompactMoney
              currency={summary.currency}
              value={summary.totalLentRemainingMinorUnits.toString()}
            />
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {isPersonal
              ? t((m) => m.SharedLoans.peopleOweYou, {
                  count: summary.lentCount,
                })
              : t((m) => m.SharedLoans.peopleOweFamily, {
                  count: summary.lentCount,
                })}
          </span>
        </button>

        {/* Borrowed Box */}
        <button
          type="button"
          onClick={() => onSelectTab?.("BORROWED")}
          className={cn(
            "p-3.5 rounded-xl border border-border bg-muted/30 text-left transition",
            "hover:bg-muted/50 hover:border-rose-500/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-1.5 rounded-full bg-rose-500" />
              <span>{borrowedLabel}</span>
            </span>
            <ArrowDownLeftIcon className="size-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            <CompactMoney
              currency={summary.currency}
              value={summary.totalBorrowedRemainingMinorUnits.toString()}
            />
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {t((m) => m.SharedLoans.pendingReturn, {
              count: summary.borrowedCount,
            })}
          </span>
        </button>
      </div>

      {/* Ratio Bar */}
      {totalExposure > BigInt(0) ? (
        <div className="mt-3.5">
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${summary.lentRatioPercent}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${summary.borrowedRatioPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
            <span className="text-emerald-600 dark:text-emerald-400">
              {t((m) => m.SharedLoans.percentOwed, {
                percent: summary.lentRatioPercent,
              })}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              {t((m) => m.SharedLoans.percentDebt, {
                percent: summary.borrowedRatioPercent,
              })}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
