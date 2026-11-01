import Link from "next/link";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Card } from "@/components/ui/card";
import type { MinorUnitValue } from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";

export function DashboardBalanceStat({
  href,
  currency,
  label,
  value,
  emptyLabel,
  variant = "default",
  indicatorColor,
}: {
  href?: string;
  currency: string;
  label: ReactNode;
  value: MinorUnitValue;
  emptyLabel?: string;
  variant?: "default" | "income" | "expense";
  indicatorColor?: "emerald" | "rose" | "amber" | "muted";
}) {
  const resolvedIndicator =
    indicatorColor ??
    (variant === "income"
      ? "emerald"
      : variant === "expense"
        ? "rose"
        : undefined);

  const inner = (
    <>
      <div className="flex items-center justify-between gap-1.5 text-[11px] text-white/70">
        <span className="truncate">{label}</span>
        {resolvedIndicator === "emerald" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "rose" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "amber" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "muted" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-white/40"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <CompactMoney
          className={cn(
            "block font-mono text-base font-bold tracking-tight sm:text-lg tabular-nums",
            variant === "income"
              ? "text-emerald-400"
              : variant === "expense"
                ? "text-rose-400"
                : "text-white",
          )}
          currency={currency}
          emptyLabel={emptyLabel}
          value={value}
        />
      </div>
    </>
  );

  const statClassName =
    "flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-3.5 transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          statClassName,
          "hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {inner}
      </Link>
    );
  }

  return <div className={statClassName}>{inner}</div>;
}

export function DashboardBalanceCard({
  label,
  currency,
  value,
  href,
  unavailable = false,
  unavailableLabel,
  badge,
  children,
  className,
}: {
  label: ReactNode;
  currency: string;
  value: MinorUnitValue;
  href?: string;
  unavailable?: boolean;
  unavailableLabel?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const balanceContent = (
    <>
      <CompactMoney
        className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        currency={currency}
        value={unavailable ? 0 : value}
      />
      {unavailable && unavailableLabel ? (
        <p className="mt-1.5 text-xs text-white/70">{unavailableLabel}</p>
      ) : null}
    </>
  );

  return (
    <Card
      className={cn(
        "family-balance-card gap-0 rounded-3xl border border-white/10 p-5 sm:p-6 text-white shadow-xl min-w-0 flex flex-col justify-between",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 truncate">
          {label}
        </span>
        {badge ?? (
          <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
            {currency}
          </span>
        )}
      </div>

      <div className="my-3">
        {href ? (
          <Link
            href={href}
            className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg"
          >
            {balanceContent}
          </Link>
        ) : (
          <div>{balanceContent}</div>
        )}
      </div>

      {children ? (
        <div className="mt-auto grid grid-cols-2 gap-2.5 sm:gap-3">
          {children}
        </div>
      ) : null}
    </Card>
  );
}
