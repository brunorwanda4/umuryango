"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { createTranslator } from "@/i18n/translate";

const t = createTranslator("FamilyDashboard");

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const barChartConfig = {
  income: {
    label: t((m) => m.FamilyDashboard.income),
    color: "var(--chart-4)",
  },
  expenses: {
    label: t((m) => m.FamilyDashboard.expenses),
    color: "var(--chart-2)",
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function FamilyFinanceCharts({
  cashFlowData,
  pieChartData,
  incomePieChartData,
  formatChartAmount,
  formatCompactChartAmount,
}: {
  cashFlowData: CashFlowPoint[];
  pieChartData: PieChartPoint[];
  incomePieChartData: PieChartPoint[];
  formatChartAmount: (value: unknown) => string;
  formatCompactChartAmount: (value: unknown) => string;
}) {
  const totalExpenses = pieChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalIncome = incomePieChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const hasCashFlowData = cashFlowData.length > 0;
  const hasPieData = pieChartData.length > 0 && totalExpenses > 0;
  const hasIncomePieData = incomePieChartData.length > 0 && totalIncome > 0;

  // Build a per-category config so the tooltip can resolve each slice's label.
  const pieChartConfig = pieChartData.reduce<ChartConfig>(
    (acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    },
    {},
  );

  // Build a per-source config for income slices.
  const incomePieChartConfig = incomePieChartData.reduce<ChartConfig>(
    (acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    },
    {},
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>
            {t((m) => m.FamilyDashboard.cashFlowAnalyticsTitle)}
          </CardTitle>
          <CardDescription>
            {t((m) => m.FamilyDashboard.cashFlowAnalyticsDesc)}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!hasCashFlowData ? (
            <EmptyChart message={t((m) => m.FamilyDashboard.noCashFlowData)} />
          ) : (
            <ChartContainer
              config={barChartConfig}
              className="h-[320px] w-full"
            >
              <BarChart
                data={cashFlowData}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                barGap={8}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />

                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />

                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={formatCompactChartAmount}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatChartAmount(value)}
                    />
                  }
                />

                <ChartLegend content={<ChartLegendContent />} />

                <Bar
                  dataKey="income"
                  name={t((m) => m.FamilyDashboard.income)}
                  fill="var(--color-income)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />

                <Bar
                  dataKey="expenses"
                  name={t((m) => m.FamilyDashboard.expenses)}
                  fill="var(--color-expenses)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className=" flex flex-col lg:flex-row gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {t((m) => m.FamilyDashboard.expenseBreakdownTitle)}
            </CardTitle>
            <CardDescription>
              {t((m) => m.FamilyDashboard.expenseBreakdownDesc)}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!hasPieData ? (
              <EmptyChart
                message={t((m) => m.FamilyDashboard.noExpenseBreakdownData)}
              />
            ) : (
              <ChartContainer
                config={{ ...barChartConfig, ...pieChartConfig }}
                className="h-[320px] w-full"
              >
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="43%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-lg font-semibold"
                  >
                    {formatChartAmount(totalExpenses)}
                  </text>

                  <text
                    x="50%"
                    y="51%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    {t((m) => m.FamilyDashboard.totalExpenses)}
                  </text>

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value, name) => [
                          formatChartAmount(value),
                          // `name` is the raw dataKey; resolve label from config
                          pieChartConfig[name as string]?.label ?? String(name),
                        ]}
                      />
                    }
                  />

                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Income breakdown donut ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {t((m) => m.FamilyDashboard.incomeBreakdownTitle)}
            </CardTitle>
            <CardDescription>
              {t((m) => m.FamilyDashboard.incomeBreakdownDesc)}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!hasIncomePieData ? (
              <EmptyChart
                message={t((m) => m.FamilyDashboard.noIncomeBreakdownData)}
              />
            ) : (
              <ChartContainer
                config={{ ...barChartConfig, ...incomePieChartConfig }}
                className="h-[320px] w-full"
              >
                <PieChart>
                  <Pie
                    data={incomePieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {incomePieChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="43%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-lg font-semibold"
                  >
                    {formatChartAmount(totalIncome)}
                  </text>

                  <text
                    x="50%"
                    y="51%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    {t((m) => m.FamilyDashboard.totalIncome)}
                  </text>

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value, name) => [
                          formatChartAmount(value),
                          incomePieChartConfig[name as string]?.label ??
                            String(name),
                        ]}
                      />
                    }
                  />

                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
