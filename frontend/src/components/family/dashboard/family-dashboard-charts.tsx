"use client";

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
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  getAuthorityBreakdown,
  getFamilyReadiness,
  getMemberGrowth,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

const authorityChartConfig = {
  members: {
    label: "Members",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const growthChartConfig = {
  total: {
    label: "Total members",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DashboardCharts({ family }: { family: FamilyDetail }) {
  const authorityData = getAuthorityBreakdown(family);
  const growthData = getMemberGrowth(family);
  const readiness = getFamilyReadiness(family);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Members by role</CardTitle>
          <CardDescription>
            A clear view of who leads and who participates.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={authorityChartConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={authorityData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="members"
                fill="var(--color-members)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <div className="grid grid-cols-3 gap-2">
            {authorityData.map((item) => (
              <div
                key={item.authority}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <p className="font-semibold text-xl">{item.members}</p>
                <p className="text-muted-foreground text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family growth</CardTitle>
          <CardDescription>
            Shows how membership has grown from saved join dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={growthChartConfig} className="h-64 w-full">
            <AreaChart accessibilityLayer data={growthData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="total"
                type="monotone"
                fill="var(--color-total)"
                fillOpacity={0.18}
                stroke="var(--color-total)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Family setup</CardTitle>
          <CardDescription>
            Basic information that helps everyone understand this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-sm">
              {readiness.completed} of {readiness.checks.length} basics ready
            </p>
            <p className="text-muted-foreground text-sm">
              {readiness.percent}% complete
            </p>
          </div>
          <Progress value={readiness.percent} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {readiness.checks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <span className="text-sm">{check.label}</span>
                <span className="font-medium text-sm">
                  {check.complete ? "Ready" : "Needs work"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
