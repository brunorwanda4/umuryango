import { cn } from "@/lib/utils";
import { formatCompactRwf } from "./formatters";
import type { RealTransaction } from "./types";

export interface PersonalMoneyTransactionsTableProps {
  items: RealTransaction[];
  currency?: string;
  emptyMessage?: string;
}

export function PersonalMoneyTransactionsTable({
  items,
  currency = "RWF",
  emptyMessage = "No records in this view yet.",
}: PersonalMoneyTransactionsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Desktop Header row */}
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-border pb-2.5 text-[13px] font-medium text-muted-foreground md:grid">
        <span>Record</span>
        <span>Type</span>
        <span>Category</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
      </div>

      {/* Row items */}
      <div className="flex flex-col">
        {items.map((x) => {
          const isIncome = x.type === "in";
          const isExpense = x.type === "out";

          return (
            <div
              key={x.id}
              className="grid grid-cols-1 items-center gap-2 border-t border-border py-3 first:border-t-0 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] md:gap-3"
            >
              {/* Record Title & Source */}
              <div className="flex min-w-0 items-center justify-between md:block">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {x.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {x.source}
                  </div>
                </div>

                {/* Mobile Amount */}
                <div
                  className={cn(
                    "font-mono text-sm font-semibold md:hidden",
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isExpense
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCompactRwf(x.amount, currency)}
                </div>
              </div>

              {/* Badges / Metadata row */}
              <div className="flex flex-wrap items-center gap-2 md:contents">
                {/* Type Badge */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                      isIncome
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : isExpense
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {isIncome ? "Income" : isExpense ? "Expense" : "Saving"}
                  </span>
                </div>

                {/* Category */}
                <div className="truncate text-xs text-muted-foreground sm:text-sm">
                  {x.category}
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground whitespace-nowrap sm:text-sm">
                  {x.date}
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                      x.status === "Received" || x.status === "Paid"
                        ? "bg-muted text-muted-foreground"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {x.status}
                  </span>
                </div>
              </div>

              {/* Desktop Amount */}
              <div
                className={cn(
                  "hidden text-right font-mono text-sm font-semibold md:block",
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isExpense
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400",
                )}
              >
                {isIncome ? "+" : "-"}
                {formatCompactRwf(x.amount, currency)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
