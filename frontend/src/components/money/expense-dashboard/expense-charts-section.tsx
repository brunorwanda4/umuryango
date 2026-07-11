import type {
  ExpenseOverTimeDatum,
  ExpenseSourceDatum,
} from "./expense-dashboard-data";
import { ExpenseOverTimeChart } from "./expense-over-time-chart";
import { ExpenseSourceChart } from "./expense-source-chart";

export function ExpenseChartsSection({
  overTime,
  sources,
  totalExpenseMinorUnits,
}: {
  overTime: ExpenseOverTimeDatum[];
  sources: ExpenseSourceDatum[];
  totalExpenseMinorUnits: string;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(25rem,1fr)]">
      <ExpenseOverTimeChart data={overTime} />
      <ExpenseSourceChart
        data={sources}
        totalExpenseMinorUnits={totalExpenseMinorUnits}
      />
    </section>
  );
}
