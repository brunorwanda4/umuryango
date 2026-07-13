"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useMemo } from "react";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPeriodLabel } from "@/lib/format-period-label";
import { IncomeChartsSection } from "./income-dashboard/income-charts-section";
import {
  type IncomeCategory,
  type IncomeDashboardResponse,
  mapIncomeDashboard,
} from "./income-dashboard/income-dashboard-data";
import { IncomeSummaryCards } from "./income-dashboard/income-summary-cards";
import { RecentIncomeTable } from "./income-dashboard/recent-income-table";

export function IncomeDashboard({
  categories,
  data,
  error,
  familyId,
  isLoading,
  onRetry,
}: {
  categories: IncomeCategory[];
  data: IncomeDashboardResponse | null;
  error: string | null;
  familyId: string | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
}) {
  const dashboard = useMemo(
    () => (data ? mapIncomeDashboard(data) : null),
    [data],
  );

  if (isLoading) {
    return <IncomeDashboardSkeleton />;
  }

  if (error || !data || !dashboard || !familyId) {
    return (
      <Alert variant="destructive" className="flex flex-col gap-4">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>Income could not be loaded</AlertTitle>
        <AlertDescription>
          {error ?? "No family workspace is available for income records."}
        </AlertDescription>
        <Button
          className="mt-3 w-fit"
          onClick={onRetry}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
      </Alert>
    );
  }

  const periodLabel = formatPeriodLabel(data.period.from, data.period.to);

  if (!categories.length) {
    return (
      <div className="grid place-content-center w-fill h-screen">
        <Alert className="flex flex-col gap-4">
          <AlertTitle>Create an income category</AlertTitle>
          <AlertDescription>
            Add your first category before recording income, such as Salary,
            Business, or Gifts.
          </AlertDescription>
          <CreateCategoryForm
            defaultType="INCOME"
            existingCategories={categories}
            familyId={familyId}
            personal
            onSuccess={onRetry}
          />
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <IncomeSummaryCards periodLabel={periodLabel} summary={data.summary} />
      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="data">
          <RecentIncomeTable
            categories={categories}
            data={dashboard.recentIncomeData}
            familyId={familyId}
            onSuccess={onRetry}
          />
        </TabsContent>
        <TabsContent value="charts">
          <IncomeChartsSection
            overTime={dashboard.incomeOverTimeData}
            sources={dashboard.incomeSourceData}
            totalIncomeMinorUnits={dashboard.totalIncomeMinorUnits}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IncomeDashboardSkeleton() {
  const summarySkeletons = ["total", "count", "period", "largest"];

  return (
    <output className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summarySkeletons.map((skeleton) => (
          <Skeleton className="h-44" key={skeleton} />
        ))}
      </div>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-96 w-full" />
      <span className="sr-only">Loading income</span>
    </output>
  );
}
