import { CircleDollarSignIcon, ListChecksIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import {
  allocationConfig,
  cashFlowConfig,
  formatCompactMinorUnits,
  formatMinorUnits,
  toChartNumber,
} from "./utils";

export function MoneyCharts({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const cashFlow = useMemo(
    () =>
      (money?.cashFlow ?? []).map((point) => ({
        ...point,
        incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
        expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
      })),
    [money],
  );
  const allocation = useMemo(
    () =>
      (money?.allocation ?? []).map((point) => ({
        ...point,
        amountMinorUnits: toChartNumber(point.amountMinorUnits),
      })),
    [money],
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Cash flow</CardTitle>
          <CardDescription>
            Income and expenses by approved source records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cashFlow.length ? (
            <ChartContainer config={cashFlowConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={cashFlow}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={(value) =>
                    formatCompactMinorUnits(value, currency)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <>
                          <span className="text-muted-foreground">
                            {name === "incomeMinorUnits"
                              ? "Income"
                              : "Expenses"}
                          </span>
                          <span className="font-mono font-medium">
                            {formatMinorUnits(value, currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="incomeMinorUnits"
                  type="monotone"
                  fill="var(--color-incomeMinorUnits)"
                  fillOpacity={0.18}
                  stroke="var(--color-incomeMinorUnits)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="expenseMinorUnits"
                  type="monotone"
                  fill="var(--color-expenseMinorUnits)"
                  fillOpacity={0.12}
                  stroke="var(--color-expenseMinorUnits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={CircleDollarSignIcon}
              title="No cash flow records"
              description="Approved income and expense records will draw this chart."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Money allocation</CardTitle>
          <CardDescription>
            Where family money is held or committed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocation.length ? (
            <ChartContainer config={allocationConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={allocation} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatCompactMinorUnits(value, currency)
                  }
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <>
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-mono font-medium">
                            {formatMinorUnits(value, currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="amountMinorUnits"
                  fill="var(--color-amountMinorUnits)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={ListChecksIcon}
              title="No allocation data"
              description="Savings, debts, contribution funds, and project budgets will appear here."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
