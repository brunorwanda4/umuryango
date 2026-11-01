import { ArrowRightIcon, ClockIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MoneyPendingAttentionProps } from "./types";

export function MoneyPendingAttentionCard({
  direction: _direction,
  title,
  subtitle,
  badgeCount,
  items,
  emptyTitle = "No pending items",
  emptyDescription = "All items have been reviewed and approved.",
  onViewAll,
  viewAllLabel = "View all",
  className,
}: MoneyPendingAttentionProps) {
  const hasItems = items.length > 0;
  const count = badgeCount ?? items.length;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-zinc-800/80 bg-[#0f0f12] p-4 sm:p-5 shadow-xs space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
            {title}
          </h3>
          {count > 0 ? (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
              {count} {count === 1 ? "pending" : "pending"}
            </span>
          ) : null}
        </div>
        {onViewAll ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-xs font-semibold text-zinc-400 hover:text-white p-0 h-auto"
          >
            <span>{viewAllLabel}</span>
            <ArrowRightIcon className="size-3.5 ml-1" />
          </Button>
        ) : null}
      </div>

      {subtitle ? (
        <p className="text-[11px] text-zinc-400 line-clamp-2">{subtitle}</p>
      ) : null}

      {hasItems ? (
        <div className="space-y-2.5 pt-0.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-900/80 border border-amber-600/30 space-y-2.5 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <ClockIcon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.title}
                    </h4>
                    {item.subtitle ? (
                      <p className="text-[10px] text-zinc-400 truncate">
                        {item.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                {item.dueDate || item.date ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono shrink-0">
                    {item.dueDate ?? item.date}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-zinc-800/80">
                <div>
                  <span className="text-zinc-400 text-[10px] block">
                    Pending Amount:
                  </span>
                  <CompactMoney
                    className="font-extrabold text-white text-sm font-mono tabular-nums"
                    currency={item.currency}
                    value={item.amountMinorUnits}
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.onView ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={item.onView}
                      className="h-7 px-2.5 text-[11px] text-zinc-300 hover:text-white"
                    >
                      Details
                    </Button>
                  ) : null}
                  {item.onAction && item.actionLabel ? (
                    <Button
                      size="sm"
                      onClick={item.onAction}
                      className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-xs transition"
                    >
                      {item.actionLabel}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-zinc-400 space-y-1">
          <p className="text-xs font-semibold text-zinc-300">{emptyTitle}</p>
          <p className="text-[10px] text-zinc-400">{emptyDescription}</p>
        </div>
      )}
    </Card>
  );
}
