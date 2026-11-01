import Link from "next/link";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Card } from "@/components/ui/card";
import type { MinorUnitValue } from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";

function isPositiveMinorUnits(value: MinorUnitValue): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value > 0 && Number.isFinite(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      !trimmed ||
      trimmed === "0" ||
      trimmed === "-0" ||
      trimmed.startsWith("-")
    ) {
      return false;
    }
    try {
      return BigInt(trimmed.split(".")[0]) > 0n;
    } catch {
      return false;
    }
  }
  return false;
}

export function DashboardBalanceStat({
  href,
  currency,
  label,
  value,
  emptyLabel,
  variant = "default",
  indicatorColor,
  description,
}: {
  href?: string;
  currency: string;
  label: ReactNode;
  value: MinorUnitValue;
  emptyLabel?: string;
  variant?: "default" | "income" | "expense";
  indicatorColor?: "emerald" | "rose" | "amber" | "muted";
  description?: ReactNode;
}) {
  const resolvedIndicator =
    indicatorColor ??
    (variant === "income"
      ? "emerald"
      : variant === "expense"
        ? "rose"
        : undefined);

  const nonZeroPositive = isPositiveMinorUnits(value);
  const prefix =
    variant === "income" && nonZeroPositive
      ? "+"
      : variant === "expense" && nonZeroPositive
        ? "−"
        : "";

  const valueColor =
    variant === "income"
      ? "text-emerald-400"
      : variant === "expense"
        ? "text-rose-400"
        : "text-white";

  const inner = (
    <>
      <div className="flex items-center justify-between gap-1 text-[11px] text-white/70">
        <span className="truncate">{label}</span>
        {resolvedIndicator === "emerald" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "rose" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "amber" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
            aria-hidden="true"
          />
        ) : resolvedIndicator === "muted" ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-white/40"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-1 flex items-baseline gap-1 font-mono">
        <span
          className={cn(
            "text-xs sm:text-sm font-bold tabular-nums",
            valueColor,
          )}
        >
          {prefix}
          <CompactMoney
            currency={currency}
            emptyLabel={emptyLabel}
            showCurrency={false}
            value={value}
          />
        </span>
        <span className="text-[10px] font-medium text-white/50">
          {currency}
        </span>
      </div>
      {description ? (
        <p className="mt-1 text-[10px] text-white/60 truncate font-sans">
          {description}
        </p>
      ) : null}
    </>
  );

  const statClassName =
    "flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-3 transition-colors min-w-0";

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
  const isUnavailable = unavailable || value === null || value === undefined;

  const balanceContent = (
    <>
      <div className="flex items-baseline gap-1.5 font-mono">
        {isUnavailable ? (
          <span className="text-3xl font-extrabold tracking-tight text-white/60 sm:text-4xl tabular-nums">
            —
          </span>
        ) : (
          <CompactMoney
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            currency={currency}
            showCurrency={false}
            value={value}
          />
        )}
        <span className="text-sm font-semibold text-white/60">{currency}</span>
      </div>
      {unavailable && unavailableLabel ? (
        <p className="mt-1 text-xs text-white/70">{unavailableLabel}</p>
      ) : null}
    </>
  );

  return (
    <Card
      className={cn(
        "family-balance-card gap-0 rounded-3xl border border-white/10 p-4 sm:p-5 text-white shadow-xl min-w-0 flex flex-col justify-between self-start",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 truncate">
          {label}
        </span>
        {badge ?? (
          <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/10">
            {currency}
          </span>
        )}
      </div>

      <div className="my-2 sm:my-2.5">
        {href ? (
          <Link
            href={href}
            className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {balanceContent}
          </Link>
        ) : (
          <div>{balanceContent}</div>
        )}
      </div>

      {children ? (
        <div className="mt-2.5 sm:mt-3 grid grid-cols-2 gap-2 sm:gap-2.5">
          {children}
        </div>
      ) : null}
    </Card>
  );
}
