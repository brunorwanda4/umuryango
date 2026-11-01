"use client";

import type { ComponentProps } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatCompactMinorUnits,
  formatFullMinorUnits,
  formatOptionalCompactMinorUnits,
  type MinorUnitValue,
} from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";

interface CompactMoneyProps extends ComponentProps<"span"> {
  currency: string;
  emptyLabel?: string;
  value: MinorUnitValue;
  showCurrency?: boolean;
}

export function CompactMoney({
  className,
  currency,
  emptyLabel,
  value,
  showCurrency = true,
  ...props
}: CompactMoneyProps) {
  const compact =
    emptyLabel === undefined
      ? formatCompactMinorUnits(value, currency, { showCurrency })
      : formatOptionalCompactMinorUnits(value, currency, emptyLabel, {
          showCurrency,
        });
  const full = formatFullMinorUnits(value, currency);
  const shouldShowTooltip =
    value !== null && value !== undefined && compact !== full;
  const content = (
    <span className={cn("tabular-nums", className)} {...props}>
      {compact}
    </span>
  );

  if (!shouldShowTooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  );
}
