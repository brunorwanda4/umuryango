import { BarChart3Icon } from "lucide-react";
import {
  Area,
  AreaChart,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { createTranslator } from "@/i18n/translate";
import { TableEmptyState } from "../money-ui-helpers";
import { formatCompactMinorUnits, formatFullMinorUnits } from "../utils";
import type { ApprovalAnalyticsModel } from "./types";
import { approvalChartConfig } from "./utils";

export function ApprovalAnalytics({
  analytics,
  currency,
  hasRecords,
}: {
  analytics: ApprovalAnalyticsModel;
  currency: string;
  hasRecords: boolean;
}) {
  const t = createTranslator("FamilyApprovals");

  if (!hasRecords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analyticsTitle")}</CardTitle>
          <CardDescription>{t("analyticsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TableEmptyState
            icon={BarChart3Icon}
            title={t("noAnalyticsYet")}
            description={t("noAnalyticsYetDesc")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("pendingVsApproved")}</CardTitle>
          <CardDescription>{t("pendingVsApprovedDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={analytics.statusComparison}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {analytics.statusComparison.map((entry) => (
                  <Cell fill={entry.fill} key={entry.label} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("approvalRateTitle")}</CardTitle>
          <CardDescription>{t("approvalRateDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[14rem_1fr]">
          <ChartContainer config={approvalChartConfig} className="h-56 w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={analytics.approvalRate}
                dataKey="count"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
              >
                {analytics.approvalRate.map((entry) => (
                  <Cell fill={entry.fill} key={entry.label} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col justify-center gap-3">
            <p className="font-semibold text-3xl">
              {analytics.approvalPercent.toFixed(0)}%
            </p>
            <p className="text-muted-foreground text-sm leading-6">
              {t("approvalRateNote")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("averageApprovalTimeTitle")}</CardTitle>
          <CardDescription>{t("averageApprovalTimeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <AreaChart accessibilityLayer data={analytics.approvalTimeByMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="averageHours"
                fill="var(--color-averageHours)"
                fillOpacity={0.18}
                stroke="var(--color-averageHours)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("approvalsByMonth")}</CardTitle>
          <CardDescription>{t("approvalsByMonthDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={analytics.approvalsByMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("approvalsByCategory")}</CardTitle>
          <CardDescription>{t("approvalsByCategoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              data={analytics.approvalsByCategory}
              layout="vertical"
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
                tickLine={false}
                axisLine={false}
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
                dataKey="amount"
                fill="var(--color-count)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rejectionsByCategory")}</CardTitle>
          <CardDescription>{t("rejectionsByCategoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              data={analytics.rejectionsByCategory}
              layout="vertical"
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-rejected)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}
