import { FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MoneyPeriod } from "./types";

export function MoneyFilters({
  period,
  periodLabel,
  onPeriodChange,
}: {
  period: MoneyPeriod;
  periodLabel: string;
  onPeriodChange: (period: MoneyPeriod) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Money period</p>
          <p className="text-muted-foreground text-xs">
            Current view: {periodLabel}
          </p>
        </div>
      </div>
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as MoneyPeriod)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Money period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="quarter">This quarter</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}
