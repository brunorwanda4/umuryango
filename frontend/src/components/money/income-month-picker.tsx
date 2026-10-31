"use client";

import { useMemo } from "react";
import { DateRangePickerInput } from "@/components/ui/calendar-day";
import { createTranslator } from "@/i18n/translate";
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
  period: { from: string; to: string };
  onPeriodChange: (period: { from: string; to: string }) => void;
}) {
  const t = createTranslator("PersonalMoney");
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
      placeholder={t("pickPeriod")}
      required
      onValueChange={(value) => {
        if (value.from && value.to) {
          onPeriodChange({ from: value.from, to: value.to });
        }
      }}
      className="w-full max-w-60 sm:w-60"
    />
  );
}
