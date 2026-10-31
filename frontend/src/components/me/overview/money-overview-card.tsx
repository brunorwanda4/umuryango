"use client";

import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CompactMoney } from "@/components/common/money/compact-money";
import { mapExpenseRecord } from "@/components/money/expense-dashboard/expense-dashboard-data";
import { ViewExpenseDialog } from "@/components/money/expense-dashboard/view-expense-dialog";
import { mapIncomeRecord } from "@/components/money/income-dashboard/income-dashboard-data";
import { ViewIncomeDialog } from "@/components/money/income-dashboard/view-income-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { createTranslator } from "@/i18n/translate";
import {
  formatFullMinorUnits,
  toChartNumber,
} from "@/lib/format-compact-number";
import type { PersonalOverviewData } from "./personal-overview-data";

export function MoneyOverviewCard({
  data,
  onSuccess,
}: {
  data: PersonalOverviewData;
  onSuccess: () => void | Promise<void>;
}) {
  const t = createTranslator("PersonalOverview.moneyCard");
  const income = data.income?.summary.periodTotalMinorUnits ?? "0";
  const expenses = data.expenses?.summary.periodTotalMinorUnits ?? "0";
  const chartConfig = useMemo(
    () =>
      ({
        amount: { label: t("amount"), color: "var(--chart-1)" },
      }) satisfies ChartConfig,
    [t],
  );
  const chartData = [
    {
      name: t("income"),
      amount: toChartNumber(income),
      fill: "var(--chart-2)",
    },
    {
      name: t("expenses"),
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
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/me/money">
              {t("openMoney")}
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
              <EmptyTitle>{t("noMoneyRecords")}</EmptyTitle>
              <EmptyDescription>{t("noMoneyRecordsDesc")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
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
              <p className="font-medium text-sm">{t("recentTransactions")}</p>
              {records.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("noRecentTransactions")}
                </p>
              ) : (
                records.map((record) => {
                  const trigger = (
                    <Button
                      key={record.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-between gap-3 whitespace-normal text-left"
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
                    </Button>
                  );
                  return record.type === "INCOME" ? (
                    <ViewIncomeDialog
                      key={record.id}
                      income={mapIncomeRecord(record)}
                      categories={data.categories}
                      familyId={record.familyId}
                      onSuccess={onSuccess}
                      trigger={trigger}
                    />
                  ) : (
                    <ViewExpenseDialog
                      key={record.id}
                      expense={mapExpenseRecord(record)}
                      categories={data.categories}
                      familyId={record.familyId}
                      onSuccess={onSuccess}
                      trigger={trigger}
                    />
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
