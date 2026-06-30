import { FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportPeriod, ReportTypeFilter } from "./types";
import { reportTypeLabels } from "./utils";

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
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Report filters</p>
          <p className="text-muted-foreground text-xs">
            Current view: {periodLabel}, {reportTypeLabels[reportType]}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Report period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={reportType}
          onValueChange={(value) =>
            onReportTypeChange(value as ReportTypeFilter)
          }
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Report type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="money">Money</SelectItem>
            <SelectItem value="contributions">Contributions</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="debts">Debts</SelectItem>
            <SelectItem value="budgets">Budgets</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
