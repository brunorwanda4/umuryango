import type {
  IncomeOverTimeDatum,
  IncomeSourceDatum,
} from "./income-dashboard-data";
import { IncomeOverTimeChart } from "./income-over-time-chart";
import { IncomeSourceChart } from "./income-source-chart";

export function IncomeChartsSection({
  overTime,
  sources,
  totalIncomeMinorUnits,
}: {
  overTime: IncomeOverTimeDatum[];
  sources: IncomeSourceDatum[];
  totalIncomeMinorUnits: string;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(25rem,1fr)]">
      <IncomeOverTimeChart data={overTime} />
      <IncomeSourceChart
        data={sources}
        totalIncomeMinorUnits={totalIncomeMinorUnits}
      />
    </section>
  );
}
