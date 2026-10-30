"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseChartsSection } from "./expense-dashboard/expense-charts-section";
import {
  type ExpenseCategory,
  type ExpenseDashboardResponse,
  mapExpenseDashboard,
} from "./expense-dashboard/expense-dashboard-data";
import { ExpenseSummaryCards } from "./expense-dashboard/expense-summary-cards";
import { RecentExpenseTable } from "./expense-dashboard/recent-expense-table";

export function ExpenseDashboard({
  categories,
  data,
  error,
  familyId,
  isLoading,
  onRetry,
}: {
  categories: ExpenseCategory[];
  data: ExpenseDashboardResponse | null;
  error: string | null;
  familyId: string | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
}) {
  const dashboard = useMemo(
    () => (data ? mapExpenseDashboard(data) : null),
    [data],
  );

  if (isLoading) {
    return <ExpenseDashboardSkeleton />;
  }

  if (error || !data || !dashboard || !familyId) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>Expenses could not be loaded</AlertTitle>
        <AlertDescription>
          {error ?? "No family workspace is available for expense records."}
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

  return (
    <div className="flex flex-col gap-4">
      <ExpenseSummaryCards summary={data.summary} />
      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="data">
          <RecentExpenseTable
            categories={categories}
            data={dashboard.recentExpenseData}
            familyId={familyId}
            onSuccess={onRetry}
          />
        </TabsContent>
        <TabsContent value="charts">
          <ExpenseChartsSection
            overTime={dashboard.expenseOverTimeData}
            sources={dashboard.expenseSourceData}
            totalExpenseMinorUnits={dashboard.totalExpenseMinorUnits}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExpenseDashboardSkeleton() {
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
      <span className="sr-only">Loading expenses</span>
    </output>
  );
}
