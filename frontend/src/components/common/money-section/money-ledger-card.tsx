import { WalletCardsIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { MoneyLedgerCardProps } from "./types";

export function MoneyLedgerCard({
  direction: _direction,
  title,
  entryCountLabel,
  filterPills = [],
  filterToolbar,
  viewMode = "table",
  onViewModeChange,
  children,
  emptyState,
  hasEntries,
  className,
}: MoneyLedgerCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-zinc-800/80 bg-[#0f0f12] p-4 sm:p-5 shadow-xs space-y-4",
        className,
      )}
    >
      {/* Header Row */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {title}
          </h3>
          {entryCountLabel ? (
            <span className="text-[10px] text-zinc-400 font-mono">
              {entryCountLabel}
            </span>
          ) : null}
        </div>

        {/* View mode toggle or actions if passed */}
        {onViewModeChange ? (
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-zinc-900/80 border border-zinc-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition",
                viewMode === "table"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition",
                viewMode === "list"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Cards
            </button>
          </div>
        ) : null}
      </div>

      {/* Filter Pills Scrollable */}
      {filterPills.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-zinc-400">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={pill.onClick}
              className={cn(
                "px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer text-[10px] sm:text-[11px]",
                pill.active
                  ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                  : "bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-400",
              )}
            >
              <span>{pill.label}</span>
              {pill.count !== undefined ? (
                <span className="ml-1 text-[9px] opacity-75">
                  ({pill.count})
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Advanced Filter Toolbar (Search, Category, Date, etc.) */}
      {filterToolbar ? <div className="pt-0.5">{filterToolbar}</div> : null}

      {/* Records Content or Empty State */}
      {hasEntries ? (
        <div className="min-w-0">{children}</div>
      ) : (
        (emptyState ?? (
          <div className="py-8 text-center text-zinc-400">
            <Empty className="border border-zinc-800 bg-zinc-900/40">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletCardsIcon className="size-6 text-zinc-500" />
                </EmptyMedia>
                <EmptyTitle className="text-zinc-300">
                  No transaction history
                </EmptyTitle>
                <EmptyDescription className="text-zinc-500 text-xs">
                  Recorded transactions will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ))
      )}
    </Card>
  );
}
