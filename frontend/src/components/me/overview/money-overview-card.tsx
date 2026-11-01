"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { CompactMoney } from "@/components/common/money/compact-money";
import { mapExpenseRecord } from "@/components/money/expense-dashboard/expense-dashboard-data";
import { ViewExpenseDialog } from "@/components/money/expense-dashboard/view-expense-dialog";
import { mapIncomeRecord } from "@/components/money/income-dashboard/income-dashboard-data";
import { ViewIncomeDialog } from "@/components/money/income-dashboard/view-income-dialog";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/i18n/translate";
import {
  formatFullMinorUnits,
  toChartNumber,
} from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";
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
        amount: {
          label: t((m) => m.PersonalOverview.moneyCard.amount),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [t],
  );
  const chartData = [
    {
      name: t((m) => m.PersonalOverview.moneyCard.income),
      amount: toChartNumber(income),
      fill: "var(--chart-2)",
    },
    {
      name: t((m) => m.PersonalOverview.moneyCard.expenses),
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
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.moneyCard.title)}
      description={t((m) => m.PersonalOverview.moneyCard.description)}
      actionHref="/me/money"
      actionLabel={t((m) => m.PersonalOverview.moneyCard.openMoney)}
    >
      {!hasMoneyData ? (
        <DashboardEmptyState
          className="min-h-64"
          icon={<ReceiptTextIcon aria-hidden="true" />}
          title={t((m) => m.PersonalOverview.moneyCard.noMoneyRecords)}
          description={t(
            (m) => m.PersonalOverview.moneyCard.noMoneyRecordsDesc,
          )}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <ChartContainer
              config={chartConfig}
              className="h-36 w-full aspect-auto"
              initialDimension={{ height: 144, width: 560 }}
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
          </div>

          <Separator className="bg-border/60" />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-xs text-foreground">
                {t((m) => m.PersonalOverview.moneyCard.recentTransactions)}
              </p>
            </div>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {t((m) => m.PersonalOverview.moneyCard.noRecentTransactions)}
              </p>
            ) : (
              <div className="space-y-2">
                {records.map((record) => {
                  const isIncome = record.type === "INCOME";
                  const trigger = (
                    <Button
                      key={record.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-between gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors whitespace-normal text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "size-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold",
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {isIncome ? (
                            <ArrowDownLeftIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowUpRightIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-xs text-foreground">
                            {record.description ?? record.category.name}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {record.category.name} ·{" "}
                            {new Date(record.date).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <CompactMoney
                          className={cn(
                            "font-mono text-xs font-bold tabular-nums block",
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400",
                          )}
                          currency={record.currency}
                          value={record.amountMinorUnits}
                        />
                      </div>
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
                })}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardSectionCard>
  );
}
