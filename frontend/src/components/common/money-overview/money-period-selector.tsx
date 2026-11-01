"use client";

import { cn } from "@/lib/utils";
import type { SharedMoneyPeriodOption } from "./types";

export interface MoneyPeriodSelectorProps {
  options: SharedMoneyPeriodOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function MoneyPeriodSelector({
  options,
  value,
  onChange,
  className,
  ariaLabel = "Select reporting period",
}: MoneyPeriodSelectorProps) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "m-0 border-0 flex items-center gap-1 p-1 rounded-xl bg-muted/70 dark:bg-muted/40 border border-border/80 text-xs font-medium overflow-x-auto no-scrollbar max-w-full",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 min-w-max px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
              isSelected
                ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
