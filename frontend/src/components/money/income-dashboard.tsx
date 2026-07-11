import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { IncomeChartsSection } from "./income-dashboard/income-charts-section";
import { IncomeSummaryCards } from "./income-dashboard/income-summary-cards";
import { RecentIncomeTable } from "./income-dashboard/recent-income-table";

export function IncomeDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <IncomeSummaryCards />
      <Tabs>
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="data">
          <RecentIncomeTable />
        </TabsContent>
        <TabsContent value="charts">
          <IncomeChartsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
