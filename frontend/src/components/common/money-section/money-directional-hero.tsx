import { CompactMoney } from "@/components/common/money/compact-money";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDirectionTheme } from "./money-section-utils";
import type { MoneyDirectionalHeroProps } from "./types";

export function MoneyDirectionalHero({
  direction,
  currency,
  totalAmountMinorUnits,
  eyebrowLabel,
  periodBadge,
  subtitle,
  progress,
  submetrics = [],
  className,
}: MoneyDirectionalHeroProps) {
  const theme = getDirectionTheme(direction);

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#111116] via-[#0d0d11] to-[#070709] p-5 sm:p-6 text-white shadow-xl min-w-0 flex flex-col justify-between",
        className,
      )}
    >
      {/* Subtle background ambient mesh glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full blur-3xl opacity-20",
          direction === "income" ? "bg-emerald-500" : "bg-rose-500",
        )}
        aria-hidden="true"
      />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 truncate">
          {eyebrowLabel}
        </span>
        {periodBadge ? (
          <div className="shrink-0">{periodBadge}</div>
        ) : (
          <span className="shrink-0 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
            {currency}
          </span>
        )}
      </div>

      {/* Big Main Amount */}
      <div className="relative z-10 my-3 sm:my-4">
        <div className="flex items-baseline gap-2">
          <CompactMoney
            className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl tabular-nums"
            currency={currency}
            value={totalAmountMinorUnits}
          />
        </div>
        {subtitle ? (
          <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      {/* Optional Progress / Budget Bar */}
      {progress ? (
        <div className="relative z-10 mt-1 mb-3">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-medium">
            <span className="truncate">{progress.label}</span>
            <span className={cn("font-bold font-mono", theme.textAccent)}>
              {progress.percentText ?? `${progress.percent}%`}
            </span>
          </div>
          <div className="w-full bg-zinc-800/90 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-700/40">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                theme.heroProgressGradient,
              )}
              style={{
                width: `${Math.min(100, Math.max(0, progress.percent))}%`,
              }}
            />
          </div>
          {progress.detailText ? (
            <p className="mt-1 text-[10px] text-zinc-500">
              {progress.detailText}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Sub-metrics Grid */}
      {submetrics.length > 0 ? (
        <div
          className={cn(
            "relative z-10 mt-auto pt-3 border-t border-zinc-800/80 grid gap-2.5 sm:gap-3",
            submetrics.length === 1
              ? "grid-cols-1"
              : submetrics.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3",
          )}
        >
          {submetrics.map((sub) => {
            const indicator = sub.indicatorColor ?? "muted";
            return (
              <div
                key={sub.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-black/50 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span className="truncate">{sub.label}</span>
                  {indicator === "emerald" ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      aria-hidden="true"
                    />
                  ) : indicator === "rose" ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
                      aria-hidden="true"
                    />
                  ) : indicator === "amber" ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      aria-hidden="true"
                    />
                  ) : indicator === "blue" ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                      aria-hidden="true"
                    />
                  ) : indicator === "purple" ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-zinc-500"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <CompactMoney
                    className={cn(
                      "font-mono text-sm sm:text-base font-bold tabular-nums",
                      sub.variant === "income"
                        ? "text-emerald-400"
                        : sub.variant === "expense"
                          ? "text-rose-400"
                          : sub.variant === "pending"
                            ? "text-amber-400"
                            : "text-zinc-200",
                    )}
                    currency={currency}
                    value={sub.value}
                  />
                </div>
                {sub.countText ? (
                  <span className="text-[10px] text-zinc-500 mt-0.5 truncate">
                    {sub.countText}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
