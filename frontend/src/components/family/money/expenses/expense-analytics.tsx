import { BarChart3Icon } from "lucide-react";
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
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { createTranslator } from "@/i18n/translate";
import { ChartEmptyState } from "../money-ui-helpers";
import type { MoneyBudgetRow } from "../types";
import {
  formatCompactMinorUnits,
  formatFullMinorUnits,
  toChartNumber,
} from "../utils";
import { formatPaymentMethod } from "./expense-utils";
import type { ExpenseTransaction } from "./types-and-schemas";

const amountConfig = {
  amount: { label: "Amount", color: "var(--chart-2)" },
} satisfies ChartConfig;

const budgetConfig = {
  budget: { label: "Budget", color: "var(--chart-4)" },
  actual: { label: "Actual", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function ExpenseAnalytics({
  transactions,
  budgets,
  currency,
}: {
  transactions: ExpenseTransaction[];
  budgets: MoneyBudgetRow[];
  currency: string;
}) {
  const t = createTranslator("FamilyExpenses");
  const approved = useMemo(
    () =>
      transactions.filter((transaction) => transaction.status === "APPROVED"),
    [transactions],
  );

  const byCategory = useMemo(
    () =>
      summarizeBy(approved, (transaction) => transaction.category.name).sort(
        (a, b) => b.amount - a.amount,
      ),
    [approved],
  );

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();

    for (const transaction of approved) {
      const date = new Date(transaction.date);
      const label = new Intl.DateTimeFormat("en", {
        month: "short",
        year: "2-digit",
      }).format(date);
      map.set(
        label,
        (map.get(label) ?? 0) + toChartNumber(transaction.amountMinorUnits),
      );
    }

    return Array.from(map, ([label, amount]) => ({ label, amount }));
  }, [approved]);

  const byMember = useMemo(
    () =>
      summarizeBy(
        approved,
        (transaction) => transaction.receivedBy || t("table.notRecorded"),
      ).sort((a, b) => b.amount - a.amount),
    [approved, t],
  );

  const byPaymentMethod = useMemo(
    () =>
      summarizeBy(approved, (transaction) =>
        formatPaymentMethod(transaction.paymentMethod),
      ).sort((a, b) => b.amount - a.amount),
    [approved],
  );

  const budgetActual = useMemo(() => {
    if (budgets.length) {
      return budgets.map((budget) => ({
        label: budget.categoryName,
        budget: toChartNumber(budget.limitMinorUnits),
        actual: toChartNumber(budget.spentMinorUnits),
      }));
    }

    return byCategory.slice(0, 5).map((category) => ({
      label: category.label,
      budget: 0,
      actual: category.amount,
    }));
  }, [budgets, byCategory]);

  const topCategories = byCategory.slice(0, 6);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AmountChart
        title={t("analytics.byCategoryTitle")}
        description={t("analytics.byCategoryDesc")}
        data={byCategory}
        currency={currency}
        layout="vertical"
        emptyTitle={t("analytics.noApprovedExpensesTitle")}
        emptyDescription={t("analytics.noApprovedExpensesDesc")}
        amountLabel={t("analytics.amount")}
      />
      <TrendChart
        data={monthlyTrend}
        currency={currency}
        title={t("analytics.monthlyTrendTitle")}
        description={t("analytics.monthlyTrendDesc")}
        emptyTitle={t("analytics.noMonthlyTrendTitle")}
        emptyDescription={t("analytics.noMonthlyTrendDesc")}
        amountLabel={t("analytics.amount")}
      />
      <AmountChart
        title={t("analytics.byMemberTitle")}
        description={t("analytics.byMemberDesc")}
        data={byMember}
        currency={currency}
        layout="vertical"
        emptyTitle={t("analytics.noApprovedExpensesTitle")}
        emptyDescription={t("analytics.noApprovedExpensesDesc")}
        amountLabel={t("analytics.amount")}
      />
      <AmountChart
        title={t("analytics.byPaymentMethodTitle")}
        description={t("analytics.byPaymentMethodDesc")}
        data={byPaymentMethod}
        currency={currency}
        layout="vertical"
        emptyTitle={t("analytics.noApprovedExpensesTitle")}
        emptyDescription={t("analytics.noApprovedExpensesDesc")}
        amountLabel={t("analytics.amount")}
      />
      <BudgetActualChart
        data={budgetActual}
        currency={currency}
        title={t("analytics.budgetVsActualTitle")}
        description={t("analytics.budgetVsActualDesc")}
        emptyTitle={t("analytics.noBudgetComparisonTitle")}
        emptyDescription={t("analytics.noBudgetComparisonDesc")}
        budgetLabel={t("analytics.budget")}
        actualLabel={t("analytics.actual")}
      />
      <AmountChart
        title={t("analytics.topCategoriesTitle")}
        description={t("analytics.topCategoriesDesc")}
        data={topCategories}
        currency={currency}
        layout="horizontal"
        emptyTitle={t("analytics.noApprovedExpensesTitle")}
        emptyDescription={t("analytics.noApprovedExpensesDesc")}
        amountLabel={t("analytics.amount")}
      />
    </section>
  );
}

function summarizeBy(
  transactions: ExpenseTransaction[],
  getLabel: (transaction: ExpenseTransaction) => string,
) {
  const map = new Map<
    string,
    { label: string; amount: number; count: number }
  >();

  for (const transaction of transactions) {
    const label = getLabel(transaction);
    const current = map.get(label) ?? { label, amount: 0, count: 0 };
    current.amount += toChartNumber(transaction.amountMinorUnits);
    current.count += 1;
    map.set(label, current);
  }

  return Array.from(map.values());
}

function AmountChart({
  title,
  description,
  data,
  currency,
  layout,
  emptyTitle,
  emptyDescription,
  amountLabel,
}: {
  title: string;
  description: string;
  data: { label: string; amount: number }[];
  currency: string;
  layout: "horizontal" | "vertical";
  emptyTitle: string;
  emptyDescription: string;
  amountLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={amountConfig} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              data={data}
              layout={layout === "vertical" ? "vertical" : "horizontal"}
            >
              <CartesianGrid
                vertical={layout !== "vertical"}
                horizontal={layout !== "vertical"}
              />
              {layout === "vertical" ? (
                <>
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
                    width={112}
                  />
                </>
              ) : (
                <>
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
                </>
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">
                          {amountLabel}
                        </span>
                        <span className="font-mono font-medium">
                          {formatFullMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="var(--color-amount)"
                radius={layout === "vertical" ? [0, 6, 6, 0] : [6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TrendChart({
  data,
  currency,
  title,
  description,
  emptyTitle,
  emptyDescription,
  amountLabel,
}: {
  data: { label: string; amount: number }[];
  currency: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  amountLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={amountConfig} className="h-72 w-full">
            <AreaChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
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
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">
                          {amountLabel}
                        </span>
                        <span className="font-mono font-medium">
                          {formatFullMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="amount"
                type="monotone"
                fill="var(--color-amount)"
                fillOpacity={0.16}
                stroke="var(--color-amount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BudgetActualChart({
  data,
  currency,
  title,
  description,
  emptyTitle,
  emptyDescription,
  budgetLabel,
  actualLabel,
}: {
  data: { label: string; budget: number; actual: number }[];
  currency: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  budgetLabel: string;
  actualLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={budgetConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
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
                          {name === "budget" ? budgetLabel : actualLabel}
                        </span>
                        <span className="font-mono font-medium">
                          {formatFullMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="budget" fill="var(--color-budget)" radius={6} />
              <Bar dataKey="actual" fill="var(--color-actual)" radius={6} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}
