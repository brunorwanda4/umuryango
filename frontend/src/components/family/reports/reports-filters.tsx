import { FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
import type { ReportPeriod, ReportTypeFilter } from "./types";

export function ReportsFilters({
  onPeriodChange,
  onReportTypeChange,
  period,
  periodLabel,
  reportType,
}: {
  onPeriodChange: (period: ReportPeriod) => void;
  onReportTypeChange: (reportType: ReportTypeFilter) => void;
  period: ReportPeriod;
  periodLabel: string;
  reportType: ReportTypeFilter;
}) {
  const t = createTranslator("FamilyReports");

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">
            {t((m) => m.FamilyReports.reportFilters)}
          </p>
          <p className="text-muted-foreground text-xs">
            {t((m) => m.FamilyReports.currentView, {
              period: periodLabel,
              type: t(`types.${reportType}`),
            })}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label={t((m) => m.FamilyReports.reportPeriod)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">
              {t((m) => m.FamilyReports.periods.month)}
            </SelectItem>
            <SelectItem value="quarter">
              {t((m) => m.FamilyReports.periods.quarter)}
            </SelectItem>
            <SelectItem value="year">
              {t((m) => m.FamilyReports.periods.year)}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={reportType}
          onValueChange={(value) =>
            onReportTypeChange(value as ReportTypeFilter)
          }
        >
          <SelectTrigger
            className="w-full sm:w-52"
            aria-label={t((m) => m.FamilyReports.reportType)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t((m) => m.FamilyReports.types.all)}
            </SelectItem>
            <SelectItem value="money">
              {t((m) => m.FamilyReports.types.money)}
            </SelectItem>
            <SelectItem value="contributions">
              {t((m) => m.FamilyReports.types.contributions)}
            </SelectItem>
            <SelectItem value="projects">
              {t((m) => m.FamilyReports.types.projects)}
            </SelectItem>
            <SelectItem value="savings">
              {t((m) => m.FamilyReports.types.savings)}
            </SelectItem>
            <SelectItem value="debts">
              {t((m) => m.FamilyReports.types.debts)}
            </SelectItem>
            <SelectItem value="budgets">
              {t((m) => m.FamilyReports.types.budgets)}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
