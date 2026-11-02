import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoneyDirectionHeaderProps } from "./types";
import { BackButton } from "../back-button";

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
  return (
    <header
      className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0 space-y-1">
        <div className=" flex gap-2  items-center">
          <BackButton />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        </div>

        {description ? (
          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed hidden md:block">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 pt-1 sm:pt-0">{actions}</div>
      ) : null}
    </header>
  );
}
