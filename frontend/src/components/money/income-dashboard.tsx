import { IncomeChartsSection } from "./income-dashboard/income-charts-section";
import { IncomeSummaryCards } from "./income-dashboard/income-summary-cards";
import { RecentIncomeTable } from "./income-dashboard/recent-income-table";

export function IncomeDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <IncomeSummaryCards />
      <IncomeChartsSection />
      <RecentIncomeTable />
    </div>
  );
}
