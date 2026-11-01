import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoneyDirectionHeaderProps } from "./types";

export function MoneyDirectionHeader({
  direction,
  title,
  eyebrow,
  eyebrowIcon,
  periodLabel,
  description,
  actions,
  className,
}: MoneyDirectionHeaderProps) {
  const DefaultIcon =
    direction === "income" ? TrendingUpIcon : TrendingDownIcon;
  const EyebrowIcon = eyebrowIcon ?? DefaultIcon;

  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow || periodLabel ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {eyebrow ? (
              <span
                className={cn(
                  "font-medium flex items-center gap-1",
                  direction === "income" ? "text-emerald-400" : "text-rose-400",
                )}
              >
                <EyebrowIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{eyebrow}</span>
              </span>
            ) : null}
            {eyebrow && periodLabel ? (
              <span
                className="text-zinc-600 dark:text-zinc-600"
                aria-hidden="true"
              >
                •
              </span>
            ) : null}
            {periodLabel ? <span>{periodLabel}</span> : null}
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>

        {description ? (
          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed hidden md:block">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 pt-1 sm:pt-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
