import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { cn } from "@/lib/utils";
import type { MoneyMobileTransactionRowProps } from "./types";

export function MoneyMobileTransactionRow({
  direction,
  title,
  subtitle,
  category,
  paymentMethod,
  paymentIcon: PaymentIcon,
  date,
  amountMinorUnits,
  currency,
  status,
  icon: SourceIcon,
  iconClassName,
  onView,
  actions,
  extraActions,
  className,
}: MoneyMobileTransactionRowProps) {
  const isIncome = direction === "income";
  const isPending =
    status.toUpperCase() === "PENDING" || status.toUpperCase() === "DRAFT";
  const isRejected =
    status.toUpperCase() === "REJECTED" || status.toUpperCase() === "REVERSED";

  const DefaultIcon = isIncome ? ArrowDownLeftIcon : ArrowUpRightIcon;
  const RowIcon = SourceIcon ?? DefaultIcon;

  return (
    <div
      className={cn(
        "relative p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/90 flex items-center justify-between gap-2.5 transition-colors group",
        isPending && "border-amber-900/40 bg-zinc-900/40",
        className,
      )}
    >
      {onView ? (
        <button
          type="button"
          aria-label={`View details for ${title}`}
          onClick={onView}
          className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        />
      ) : null}

      <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            isPending
              ? "bg-amber-500/10 text-amber-400"
              : isIncome
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400",
            iconClassName,
          )}
        >
          <RowIcon className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{title}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
            {category ? <span className="truncate">{category}</span> : null}
            {category && (paymentMethod || date) ? (
              <span className="text-zinc-600" aria-hidden="true">
                •
              </span>
            ) : null}
            {paymentMethod ? (
              <span className="inline-flex items-center gap-1 truncate">
                {PaymentIcon && <PaymentIcon className="size-2.5" />}
                {paymentMethod}
              </span>
            ) : null}
            {paymentMethod && date ? (
              <span className="text-zinc-600" aria-hidden="true">
                •
              </span>
            ) : null}
            {date ? <span className="truncate">{date}</span> : null}
            {subtitle ? (
              <>
                <span className="text-zinc-600" aria-hidden="true">
                  •
                </span>
                <span className="truncate">{subtitle}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 shrink-0 pointer-events-auto">
        <div className="text-right pointer-events-none">
          <span
            className={cn(
              "text-xs sm:text-sm font-bold font-mono tabular-nums block",
              isPending
                ? "text-amber-400"
                : isIncome
                  ? "text-emerald-400"
                  : "text-rose-400",
            )}
          >
            {isIncome ? "+" : "-"}
            <CompactMoney currency={currency} value={amountMinorUnits} />
          </span>
          <span
            className={cn(
              "block text-[9px] font-medium capitalize",
              isPending
                ? "text-amber-500"
                : isRejected
                  ? "text-rose-500"
                  : isIncome
                    ? "text-emerald-500"
                    : "text-zinc-400",
            )}
          >
            {status.toLowerCase().replace(/_/g, " ")}
          </span>
        </div>

        {extraActions}
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
