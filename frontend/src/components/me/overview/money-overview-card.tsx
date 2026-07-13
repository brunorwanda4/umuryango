"use client";

import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  formatFullMinorUnits,
  toChartNumber,
} from "@/lib/format-compact-number";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";

const chartConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function MoneyOverviewCard({ data }: { data: PersonalOverviewData }) {
  const income = data.income?.summary.periodTotalMinorUnits ?? "0";
  const expenses = data.expenses?.summary.periodTotalMinorUnits ?? "0";
  const remaining = addMinorUnits(income) - addMinorUnits(expenses);
  const chartData = [
    { name: "Income", amount: toChartNumber(income), fill: "var(--chart-2)" },
    {
      name: "Expenses",
      amount: toChartNumber(expenses),
      fill: "var(--chart-1)",
    },
  ];
  const records = [
    ...(data.income?.records ?? []),
    ...(data.expenses?.records ?? []),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);
  const hasMoneyData = Boolean(data.income || data.expenses);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Money overview</CardTitle>
        <CardDescription>
          Your personal income and expenses this month.
        </CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/me/money">
              My money
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!hasMoneyData ? (
          <Empty className="min-h-64 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No money records yet</EmptyTitle>
              <EmptyDescription>
                Start by adding your income or expenses.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                label="Income"
                currency={data.currency}
                value={income}
              />
              <MiniStat
                label="Expenses"
                currency={data.currency}
                value={expenses}
              />
              <MiniStat
                label="Remaining"
                currency={data.currency}
                value={remaining.toString()}
              />
            </div>
            <ChartContainer
              config={chartConfig}
              className="h-44 w-full aspect-auto"
              initialDimension={{ height: 176, width: 560 }}
            >
              <BarChart
                data={chartData}
                margin={{ left: 0, right: 8, top: 8 }}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatFullMinorUnits(value, data.currency)
                          : value
                      }
                    />
                  }
                />
                <Bar dataKey="amount" radius={8} />
              </BarChart>
            </ChartContainer>
            <Separator />
            <div className="flex flex-col gap-3">
              <p className="font-medium text-sm">Recent transactions</p>
              {records.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No recent transactions.
                </p>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {record.description ?? record.category.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {record.category.name} ·{" "}
                        {new Date(record.date).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <CompactMoney
                      className="font-medium"
                      currency={record.currency}
                      value={record.amountMinorUnits}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        <Button asChild size="sm">
          <Link href="/me/money/income">Add income</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/me/money/expenses">Add expense</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function MiniStat({
  currency,
  label,
  value,
}: {
  currency: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-muted p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-semibold text-sm">
        <CompactMoney currency={currency} value={value} />
      </p>
    </div>
  );
}
