"use client";

import { useMemo } from "react";
import { DatePickerInput } from "@/components/ui/calendar-day";
import { formatMonthPeriod, getMonthPeriod } from "./utils";

/**
 * A calendar picker that lets the user pick the dashboard month.
 *
 * The selected date is normalized to `YYYY-MM`, preserving the month-based
 * query contract used by income and expense dashboards.
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
    <DatePickerInput
      id="income-month"
      name="income-month"
      value={`${month}-01`}
      min="2000-01-01"
      max="2100-12-31"
      align="end"
      displayValue={formatMonthPeriod(period.from, period.to)}
      placeholder="Pick a month"
      onValueChange={(date) => onMonthChange(date.slice(0, 7))}
    />
  );
}
