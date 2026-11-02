"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { MoneyDirectionalHero } from "@/components/common/money-section/money-directional-hero";
import { MoneyPendingAttentionCard } from "@/components/common/money-section/money-pending-attention-card";
import { MoneySectionSkeleton } from "@/components/common/money-section/money-section-skeleton";
import { addMinorUnits } from "@/components/common/money-section/money-section-utils";
import type {
  MoneyHeroSubmetric,
  MoneyPendingAttentionItem,
} from "@/components/common/money-section/types";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import { ExpenseChartsSection } from "./expense-dashboard/expense-charts-section";
import {
  type ExpenseCategory,
  type ExpenseDashboardResponse,
  mapExpenseDashboard,
} from "./expense-dashboard/expense-dashboard-data";
import { RecentExpenseTable } from "./expense-dashboard/recent-expense-table";
import { ViewExpenseDialog } from "./expense-dashboard/view-expense-dialog";

export function ExpenseDashboard({
  categories,
  data,
  error,
  familyId,
  isLoading,
  onRetry,
  periodLabel,
}: {
  categories: ExpenseCategory[];
  allCategories?: ExpenseCategory[];
  data: ExpenseDashboardResponse | null;
  error: string | null;
  familyId: string | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
  periodLabel?: string;
}) {
  const t = createTranslator("PersonalMoney.personalExpenses");
  const [activeTab, setActiveTab] = useState("data");
  const [viewPendingExpenseId, setViewPendingExpenseId] = useState<
    string | null
  >(null);

  const dashboard = useMemo(
    () => (data ? mapExpenseDashboard(data) : null),
    [data],
  );

  const pendingRecords = useMemo(
    () => data?.records.filter((r) => r.status === "PENDING") ?? [],
    [data?.records],
  );

  const approvedRecords = useMemo(
    () => data?.records.filter((r) => r.status === "APPROVED") ?? [],
    [data?.records],
  );

  const pendingTotal = useMemo(
    () => addMinorUnits(...pendingRecords.map((r) => r.amountMinorUnits)),
    [pendingRecords],
  );

  const selectedPendingExpense = useMemo(
    () =>
      dashboard?.recentExpenseData.find(
        (exp) => exp.id === viewPendingExpenseId,
      ),
    [dashboard?.recentExpenseData, viewPendingExpenseId],
  );

  const submetrics = useMemo<MoneyHeroSubmetric[]>(() => {
    if (!data) return [];
    return [
      {
        id: "approved-outflows",
        label: "Approved Outflows",
        value: data.summary.periodTotalMinorUnits,
        variant: "expense",
        indicatorColor: "rose",
        countText: `${approvedRecords.length} completed expenses`,
      },
      {
        id: "pending-or-alltime",
        label:
          pendingRecords.length > 0 ? "Pending Outflows" : "All-Time Expenses",
        value:
          pendingRecords.length > 0
            ? pendingTotal
            : data.summary.allTimeTotalMinorUnits,
        variant: pendingRecords.length > 0 ? "pending" : "neutral",
        indicatorColor: pendingRecords.length > 0 ? "amber" : "blue",
        countText:
          pendingRecords.length > 0
            ? `${pendingRecords.length} awaiting approval`
            : "Total all-time recorded",
      },
      {
        id: "largest-expense",
        label: "Largest Outflow",
        value: data.summary.largestExpense?.amountMinorUnits ?? "0",
        variant: "neutral",
        indicatorColor: "purple",
        countText: data.summary.largestExpense?.category ?? "No records",
      },
      {
        id: "record-count",
        label: "Recorded Expenses",
        value: data.summary.transactionCount,
        variant: "neutral",
        indicatorColor: "muted",
        countText: `${data.summary.transactionCount} entries recorded`,
      },
    ];
  }, [data, approvedRecords.length, pendingRecords.length, pendingTotal]);

  const pendingAttentionItems = useMemo<MoneyPendingAttentionItem[]>(() => {
    return pendingRecords.map((record) => ({
      id: record.id,
      title: record.description || record.category.name,
      subtitle: record.notes ?? undefined,
      date: record.date.slice(0, 10),
      amountMinorUnits: record.amountMinorUnits,
      currency: record.currency,
      status: record.status,
      actionLabel: "View details",
      onAction: () => setViewPendingExpenseId(record.id),
      onView: () => setViewPendingExpenseId(record.id),
    }));
  }, [pendingRecords]);

  if (isLoading) {
    return <MoneySectionSkeleton />;
  }

  if (error || !data || !dashboard || !familyId) {
    return (
      <Alert variant="destructive" className="flex flex-col gap-4">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>
          {t((m) => m.PersonalMoney.personalExpenses.loadError)}
        </AlertTitle>
        <AlertDescription>
          {error ?? t((m) => m.PersonalMoney.personalExpenses.noWorkspace)}
        </AlertDescription>
        <Button
          className="mt-3 w-fit"
          onClick={onRetry}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon data-icon="inline-start" />
          {t((m) => m.PersonalMoney.personalExpenses.tryAgain)}
        </Button>
      </Alert>
    );
  }

  if (!categories.length) {
    return (
      <div className="grid place-content-center w-full min-h-[400px]">
        <Alert className="flex flex-col gap-4 max-w-lg">
          <AlertTitle>Create an expense category</AlertTitle>
          <AlertDescription>
            Add your first category before recording expenses, such as Food,
            Rent, or Utilities.
          </AlertDescription>
          <CreateCategoryForm
            defaultType="EXPENSE"
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
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* 1. Top Section: Directional Hero + Optional Pending Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div
          className={
            pendingRecords.length > 0
              ? "lg:col-span-7 xl:col-span-7"
              : "lg:col-span-12"
          }
        >
          <MoneyDirectionalHero
            direction="expense"
            currency="RWF"
            totalAmountMinorUnits={data.summary.periodTotalMinorUnits}
            eyebrowLabel="TOTAL EXPENSES RECORDED (RWF)"
            periodBadge={
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {periodLabel ?? "This Month"}
              </span>
            }
            submetrics={submetrics}
          />
        </div>

        {pendingRecords.length > 0 ? (
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            <MoneyPendingAttentionCard
              direction="expense"
              title="Pending Expenses"
              badgeCount={pendingRecords.length}
              items={pendingAttentionItems}
            />
          </div>
        ) : null}
      </div>

      {/* 2. Transaction Ledger & Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="data">
            {t((m) => m.PersonalMoney.personalExpenses.dataTab)}
          </TabsTrigger>
          <TabsTrigger value="charts">
            {t((m) => m.PersonalMoney.personalExpenses.chartsTab)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <RecentExpenseTable
            categories={categories}
            data={dashboard.recentExpenseData}
            familyId={familyId}
            onSuccess={onRetry}
          />
        </TabsContent>

        <TabsContent value="charts" className="mt-4">
          <ExpenseChartsSection
            overTime={dashboard.expenseOverTimeData}
            sources={dashboard.expenseSourceData}
            totalExpenseMinorUnits={dashboard.totalExpenseMinorUnits}
          />
        </TabsContent>
      </Tabs>

      {/* Pending Expense View Dialog */}
      {selectedPendingExpense ? (
        <ViewExpenseDialog
          categories={categories}
          familyId={familyId}
          expense={selectedPendingExpense}
          open={Boolean(viewPendingExpenseId)}
          onOpenChange={(open) => {
            if (!open) setViewPendingExpenseId(null);
          }}
          trigger={null}
          onSuccess={onRetry}
        />
      ) : null}
    </div>
  );
}
