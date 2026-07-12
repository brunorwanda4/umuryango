"use client";

import { ChevronDownIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatFullMinorUnits } from "@/lib/format-compact-number";
import type { ExpenseOverTimeDatum } from "./expense-dashboard-data";
import { formatCompactAmount } from "./formatters";

const expenseChartConfig = {
  amount: {
    color: "var(--chart-1)",
    label: "Expenses",
  },
} satisfies ChartConfig;

export function ExpenseOverTimeChart({
  data,
}: {
  data: ExpenseOverTimeDatum[];
}) {
  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
        <CardTitle className="font-bold text-base">
          Expenses over time
        </CardTitle>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-3 rounded-lg border bg-background px-4 font-medium text-sm shadow-xs"
        >
          This Month
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </button>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <ChartContainer
          config={expenseChartConfig}
          className="h-[300px] w-full aspect-auto"
          initialDimension={{ height: 300, width: 660 }}
        >
          <AreaChart
            data={data}
            margin={{ bottom: 0, left: 8, right: 18, top: 18 }}
          >
            <defs>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 7"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              axisLine={false}
              dataKey="day"
              interval={4}
              tickLine={false}
              tickMargin={14}
              fontSize={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              fontSize={12}
              tickFormatter={formatCompactAmount}
              width={44}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatFullMinorUnits(value, "RWF")
                      : value
                  }
                />
              }
            />
            <Area
              dataKey="amount"
              fill="url(#expenseFill)"
              stroke="var(--chart-1)"
              strokeWidth={2}
              type="monotone"
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
