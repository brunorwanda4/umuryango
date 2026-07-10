import { IncomeOverTimeChart } from "./income-over-time-chart";
import { IncomeSourceChart } from "./income-source-chart";

export function IncomeChartsSection() {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(25rem,1fr)]">
      <IncomeOverTimeChart />
      <IncomeSourceChart />
    </section>
  );
}
