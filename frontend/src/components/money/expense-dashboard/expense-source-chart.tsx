"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatFullMinorUnits } from "@/lib/format-compact-number";
import { formatRf } from "./formatters";
import type { ExpenseSourceDatum } from "./expense-dashboard-data";
import { ExpenseSourceLegend } from "./expense-source-legend";

export function ExpenseSourceChart({
  data,
  totalExpenseMinorUnits,
}: {
  data: ExpenseSourceDatum[];
  totalExpenseMinorUnits: string;
}) {
  const sourceChartConfig = data.reduce<ChartConfig>((config, source) => {
    config[source.name] = {
      color: source.color,
      label: source.name,
    };
    return config;
  }, {});
  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardHeader className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
        <CardTitle className="font-bold text-base">
          Expenses by category
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 lg:grid-cols-[minmax(13rem,1fr)_auto] lg:items-center">
        <ChartContainer
          config={sourceChartConfig}
          className="mx-auto h-[260px] w-full max-w-[290px] aspect-square"
          initialDimension={{ height: 260, width: 260 }}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="amountMinorUnits"
              innerRadius={64}
              nameKey="name"
              outerRadius={106}
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((source) => (
                <Cell key={source.name} fill={source.color} />
              ))}
            </Pie>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-bold text-lg"
            >
              {formatRf(Number(totalExpenseMinorUnits))}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              Total
            </text>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatFullMinorUnits(value, "RWF")
                      : value
                  }
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <ExpenseSourceLegend
          data={data}
          totalExpenseMinorUnits={totalExpenseMinorUnits}
        />
      </CardContent>
    </Card>
  );
}
