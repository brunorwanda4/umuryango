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
    <Card className="relative min-w-0 overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#111116] via-[#0d0d11] to-[#070709] p-5 text-white shadow-xl sm:p-6">
      <div
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-20 blur-3xl",
          isNetNegative ? "bg-rose-500" : "bg-emerald-500",
        )}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {t((m) => m.SharedLoans.netCreditExposure)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          {summary.overdueCount > 0 ? (
            <Badge
              variant="outline"
              className="border-rose-500/30 bg-rose-500/10 text-[10px] font-medium text-rose-300"
            >
              {t((m) => m.SharedLoans.overdueCount, {
                count: summary.overdueCount,
              })}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className="border-zinc-700/50 bg-zinc-800/80 text-[10px] font-medium text-zinc-300"
          >
            {t((m) => m.SharedLoans.activeContracts, {
              count: summary.activeCount,
            })}
          </Badge>
        </div>
      </div>

      <div className="relative z-10 my-3 sm:my-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl">
            {isNetPositive ? "+" : ""}
            <CompactMoney
              currency={summary.currency}
              value={summary.netBalanceMinorUnits.toString()}
            />
          </span>
          <span
            className={cn(
              "text-xs font-semibold",
              isNetPositive && "text-emerald-400",
              isNetNegative && "text-rose-400",
              !isNetPositive && !isNetNegative && "text-zinc-400",
            )}
          >
            {isNetPositive
              ? t((m) => m.SharedLoans.netAsset)
              : isNetNegative
                ? t((m) => m.SharedLoans.netDebt)
                : t((m) => m.SharedLoans.settled)}
          </span>
        </div>
      </div>

      {totalExposure > BigInt(0) ? (
        <div className="relative z-10 mb-3 mt-1">
          <div className="flex h-2 w-full overflow-hidden rounded-full border border-zinc-700/40 bg-zinc-800/90 p-0.5">
            <div
              className="h-full rounded-r-full bg-rose-400 transition-all duration-500"
              style={{ width: `${summary.borrowedRatioPercent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px]">
            <span className="text-emerald-400">
              {t((m) => m.SharedLoans.percentOwed, {
                percent: summary.lentRatioPercent,
              })}
            </span>
            <span className="text-rose-400">
              {t((m) => m.SharedLoans.percentDebt, {
                percent: summary.borrowedRatioPercent,
              })}
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mt-auto grid grid-cols-2 gap-2.5 border-t border-zinc-800/80 pt-3 sm:gap-3">
        <button
          type="button"
          onClick={() => onSelectTab?.("LENT")}
          className={cn(
            "flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-800/80 bg-black/50 p-3 text-left transition sm:p-3.5",
            "hover:border-emerald-500/30 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <div className="mb-1 flex w-full items-center justify-between gap-1 text-[11px] text-zinc-400">
            <span className="truncate">{lentLabel}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <ArrowUpRightIcon
                aria-hidden="true"
                className="size-3.5 text-emerald-400"
              />
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-400 tabular-nums sm:text-base">
            <CompactMoney
              currency={summary.currency}
              value={summary.totalLentRemainingMinorUnits.toString()}
            />
          </div>
          <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
            {isPersonal
              ? t((m) => m.SharedLoans.peopleOweYou, {
                  count: summary.lentCount,
                })
              : t((m) => m.SharedLoans.peopleOweFamily, {
                  count: summary.lentCount,
                })}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab?.("BORROWED")}
          className={cn(
            "flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-800/80 bg-black/50 p-3 text-left transition sm:p-3.5",
            "hover:border-rose-500/30 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <div className="mb-1 flex w-full items-center justify-between gap-1 text-[11px] text-zinc-400">
            <span className="truncate">{borrowedLabel}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <ArrowDownLeftIcon
                aria-hidden="true"
                className="size-3.5 text-rose-400"
              />
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-rose-400 tabular-nums sm:text-base">
            <CompactMoney
              currency={summary.currency}
              value={summary.totalBorrowedRemainingMinorUnits.toString()}
            />
          </div>
          <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
            {t((m) => m.SharedLoans.pendingReturn, {
              count: summary.borrowedCount,
            })}
          </span>
        </button>
      </div>
    </Card>
  );
}
