"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMonthPeriod, getMonthPeriod } from "./utils";

/**
 * A popover that lets the user pick a calendar month.
 *
 * Renders the formatted period label as the trigger button and an `<input
 * type="month">` inside the popover body. Can be dropped into any page header
 * that needs month-range selection (e.g. income, expenses, savings).
 *
 * @example
 * <IncomeMonthPicker month={month} onMonthChange={setMonth} />
 */
export function IncomeMonthPicker({
  month,
  onMonthChange,
}: {
  /** Currently selected month as a `YYYY-MM` string. */
  month: string;
  /** Called with the new `YYYY-MM` string when the user picks a month. */
  onMonthChange: (month: string) => void;
}) {
  const period = useMemo(() => getMonthPeriod(month), [month]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <span>{formatMonthPeriod(period.from, period.to)}</span>
          <CalendarDaysIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <label
          className="flex flex-col gap-2 font-medium text-sm"
          htmlFor="income-month"
        >
          Income month
          <Input
            aria-label="Income month"
            id="income-month"
            max="9999-12"
            min="2000-01"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={month}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
