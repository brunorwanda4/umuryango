"use client";

import { useMemo } from "react";
import { DateRangePickerInput } from "@/components/ui/calendar-day";
import { formatMonthPeriod } from "./utils";

/**
 * A calendar picker that lets the user pick the dashboard period.
 *
 * Supports exact calendar ranges plus the shared quick picks such as
 * last week, last month, and last year.
 *
 * @example
 * <IncomeMonthPicker period={period} onPeriodChange={setPeriod} />
 */
export function IncomeMonthPicker({
  period,
  onPeriodChange,
}: {
  /** Currently selected dashboard period as ISO date strings. */
  period: { from: string; to: string };
  /** Called with the new ISO date range when the user picks a period. */
  onPeriodChange: (period: { from: string; to: string }) => void;
}) {
  const periodLabel = useMemo(
    () => formatMonthPeriod(period.from, period.to),
    [period.from, period.to],
  );

  return (
    <DateRangePickerInput
      id="income-period"
      name="income-period"
      value={period}
      min="2000-01-01"
      max="2100-12-31"
      align="end"
      calendarMonths={1}
      displayValue={periodLabel}
      placeholder="Pick a period"
      required
      onValueChange={(value) => {
        if (value.from && value.to) {
          onPeriodChange({ from: value.from, to: value.to });
        }
      }}
      className="max-w-60"
    />
  );
}
