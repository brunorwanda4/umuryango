import { FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyMoney");

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">{t("moneyPeriod")}</p>
          <p className="text-muted-foreground text-xs">
            {t("currentView", { period: periodLabel })}
          </p>
        </div>
      </div>
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as MoneyPeriod)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label={t("moneyPeriod")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">{t("periods.month")}</SelectItem>
          <SelectItem value="quarter">{t("periods.quarter")}</SelectItem>
          <SelectItem value="year">{t("periods.year")}</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}
