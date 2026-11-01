import { LayersIcon, PlusIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDirectionTheme } from "./money-section-utils";
import type { MoneyCategoryBreakdownProps } from "./types";

const defaultCategoryColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-cyan-500",
];

const defaultCategoryTextColors = [
  "text-blue-400",
  "text-emerald-400",
  "text-purple-400",
  "text-amber-400",
  "text-rose-400",
  "text-teal-400",
  "text-indigo-400",
  "text-cyan-400",
];

export function MoneyCategoryBreakdownCard({
  direction,
  title,
  subtitle,
  activeCountLabel,
  currency,
  items,
  emptyTitle = "No categories registered",
  emptyDescription = "Categories will help organize and track your money.",
  onAddCategory,
  addCategoryLabel = "Add category",
  className,
}: MoneyCategoryBreakdownProps) {
  const theme = getDirectionTheme(direction);
  const hasItems = items.length > 0;

  // Safe percentage calculation for segments
  const topSegments = items.slice(0, 5);

  return (
    <Card
      className={cn(
        "rounded-2xl border border-zinc-800/80 bg-[#0f0f12] p-4 sm:p-5 shadow-xs space-y-3.5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
          {title}
        </h3>
        {activeCountLabel ? (
          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
            {activeCountLabel}
          </span>
        ) : hasItems ? (
          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
            {items.length} {items.length === 1 ? "stream" : "streams"}
          </span>
        ) : null}
      </div>

      {subtitle ? (
        <p className="text-[11px] text-zinc-400 line-clamp-2">{subtitle}</p>
      ) : null}

      {hasItems ? (
        <>
          {/* Segmented Inflow/Outflow Allocation Bar */}
          <div className="w-full bg-zinc-800/90 h-2 rounded-full overflow-hidden flex border border-zinc-700/40">
            {topSegments.map((item, idx) => {
              const colorBg =
                item.color ??
                defaultCategoryColors[idx % defaultCategoryColors.length];
              return (
                <div
                  key={item.id}
                  className={cn("h-full transition-all duration-300", colorBg)}
                  style={{ width: `${Math.max(2, item.percentage)}%` }}
                  title={`${item.name}: ${item.percentage}%`}
                />
              );
            })}
          </div>

          {/* Allocation percentages legend line */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-400 px-0.5 font-mono gap-1.5">
            {topSegments.slice(0, 3).map((item, idx) => {
              const textColor =
                defaultCategoryTextColors[
                  idx % defaultCategoryTextColors.length
                ];
              return (
                <span
                  key={item.id}
                  className={cn("font-semibold truncate", textColor)}
                >
                  {item.percentage}% {item.name}
                </span>
              );
            })}
          </div>

          {/* Stream / Category Cards List */}
          <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const Icon = item.icon ?? LayersIcon;
              const colorBg =
                defaultCategoryColors[idx % defaultCategoryColors.length];
              const textColor =
                defaultCategoryTextColors[
                  idx % defaultCategoryTextColors.length
                ];

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs transition-colors hover:bg-zinc-800/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-opacity-10",
                        colorBg,
                      )}
                    >
                      <Icon
                        className={cn("w-4 h-4", textColor)}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {item.name}
                      </p>
                      {item.subtitle ? (
                        <p className="text-[10px] text-zinc-400 truncate">
                          {item.subtitle}
                        </p>
                      ) : (
                        <p className="text-[10px] text-zinc-500">
                          {item.percentage}% of total
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-white block tabular-nums">
                      <CompactMoney
                        currency={currency}
                        value={item.amountMinorUnits}
                      />
                    </span>
                    <span
                      className={cn(
                        "block text-[10px] font-mono font-medium",
                        theme.textAccent,
                      )}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="py-8 text-center text-zinc-400 space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <LayersIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-zinc-300">{emptyTitle}</p>
          <p className="text-[10px] text-zinc-400">{emptyDescription}</p>
          {onAddCategory ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onAddCategory}
              className="mt-2 text-xs"
            >
              <PlusIcon data-icon="inline-start" className="size-3.5" />
              {addCategoryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
