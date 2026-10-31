import { BarChart3Icon, PieChartIcon } from "lucide-react";
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
import { createTranslator } from "@/i18n/translate";
import { ChartEmptyState } from "./reports-ui-helpers";
import type { MoneyOverview, ReportsOverview } from "./types";
import {
  breakdownConfig,
  formatCompactMinorUnits,
  formatFullMinorUnits,
  getBreakdownData,
  getTrendData,
  getTrendLabel,
  trendConfig,
} from "./utils";

export function ReportsCharts({
  currency,
  money,
  reports,
}: {
  currency: string;
  money: MoneyOverview | null;
  reports: ReportsOverview | null;
}) {
  const t = createTranslator("FamilyReports");
  const trend = useMemo(() => getTrendData(reports, money), [reports, money]);
  const breakdown = useMemo(
    () => getBreakdownData(reports, money),
    [reports, money],
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("moneyMovementTitle")}</CardTitle>
          <CardDescription>{t("moneyMovementDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length ? (
            <ChartContainer config={trendConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={trend}>
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
                            {getTrendLabel(String(name))}
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
                <Area
                  dataKey="contributionsPaidMinorUnits"
                  type="monotone"
                  fill="var(--color-contributionsPaidMinorUnits)"
                  fillOpacity={0.1}
                  stroke="var(--color-contributionsPaidMinorUnits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              description={t("noReportTrendDataDesc")}
              icon={BarChart3Icon}
              title={t("noReportTrendData")}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reportBreakdownTitle")}</CardTitle>
          <CardDescription>{t("reportBreakdownDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown.length ? (
            <ChartContainer config={breakdownConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={breakdown} layout="vertical">
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
                  width={104}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <>
                          <span className="text-muted-foreground">
                            {t("amountLabel")}
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
                  dataKey="amountMinorUnits"
                  fill="var(--color-amountMinorUnits)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              description={t("noBreakdownDataDesc")}
              icon={PieChartIcon}
              title={t("noBreakdownData")}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
