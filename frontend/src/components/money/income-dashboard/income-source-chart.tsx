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
import {
  incomeSourceData,
  totalIncomeMinorUnits,
} from "./income-dashboard-data";
import { IncomeSourceLegend } from "./income-source-legend";

const sourceChartConfig = incomeSourceData.reduce<ChartConfig>(
  (config, source) => {
    config[source.name] = {
      color: source.color,
      label: source.name,
    };
    return config;
  },
  {},
);

export function IncomeSourceChart() {
  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardHeader className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
        <CardTitle className="font-bold text-base">Income by source</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-5 pb-5 sm:px-6 lg:grid-cols-[minmax(13rem,1fr)_auto] lg:items-center">
        <ChartContainer
          config={sourceChartConfig}
          className="mx-auto h-[260px] w-full max-w-[290px] aspect-square"
          initialDimension={{ height: 260, width: 260 }}
        >
          <PieChart>
            <Pie
              data={incomeSourceData}
              dataKey="amountMinorUnits"
              innerRadius={64}
              nameKey="name"
              outerRadius={106}
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {incomeSourceData.map((source) => (
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
              {formatRf(totalIncomeMinorUnits)}
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
        <IncomeSourceLegend />
      </CardContent>
    </Card>
  );
}
