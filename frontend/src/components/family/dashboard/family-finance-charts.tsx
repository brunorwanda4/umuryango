import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  amount: {
    label: "Amount",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type CashFlowPoint = {
  label: string;
  income: number;
  expenses: number;
};

type PieChartPoint = {
  name: string;
  amount: number;
};

export function FamilyFinanceCharts({
  cashFlowData,
  pieChartData,
  formatChartAmount,
  formatCompactChartAmount,
}: {
  cashFlowData: CashFlowPoint[];
  pieChartData: PieChartPoint[];
  formatChartAmount: (value: unknown) => string;
  formatCompactChartAmount: (value: unknown) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Cash flow analytics</CardTitle>
          <CardDescription>
            Income vs expenses over the current reporting window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={cashFlowData}
              margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactChartAmount}
              />
              <RechartsTooltip
                formatter={(value: unknown) => formatChartAmount(value)}
                cursor={{ fill: "transparent" }}
              />
              <Legend iconType="circle" />
              <Bar
                dataKey="income"
                name="Income"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="var(--color-expenses)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Expense breakdown</CardTitle>
          <CardDescription>Where family money was spent.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="name"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: unknown) => formatChartAmount(value)}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
