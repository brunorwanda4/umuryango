"use client";

import {
  AlertCircleIcon,
  LayersIcon,
  PieChartIcon,
  PlusCircleIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MoneyActionGrid } from "@/components/common/money-section/money-action-grid";
import { MoneyCategoryBreakdownCard } from "@/components/common/money-section/money-category-breakdown-card";
import { MoneyDirectionalHero } from "@/components/common/money-section/money-directional-hero";
import { MoneyPendingAttentionCard } from "@/components/common/money-section/money-pending-attention-card";
import { MoneySectionSkeleton } from "@/components/common/money-section/money-section-skeleton";
import {
  addMinorUnits,
  safeCalculatePercentage,
} from "@/components/common/money-section/money-section-utils";
import type {
  MoneyActionItem,
  MoneyCategoryItem,
  MoneyHeroSubmetric,
  MoneyPendingAttentionItem,
} from "@/components/common/money-section/types";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  allCategories,
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
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
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

  const categoryItems = useMemo<MoneyCategoryItem[]>(() => {
    if (!dashboard || !data) return [];
    return dashboard.expenseSourceData.map((source) => ({
      id: source.name,
      name: source.name,
      amountMinorUnits: source.amountMinorUnitsValue,
      percentage: safeCalculatePercentage(
        source.amountMinorUnitsValue,
        data.summary.periodTotalMinorUnits,
      ),
      color: source.color,
    }));
  }, [dashboard, data]);

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

  const quickActions = useMemo<MoneyActionItem[]>(() => {
    return [
      {
        id: "record-expense",
        label: "Record expense",
        description: "Log payment or cost",
        icon: PlusCircleIcon,
        iconColor: "rose",
        onClick: () => setIsRecordExpenseOpen(true),
      },
      {
        id: "add-category",
        label: "New category",
        description: "Organize expense types",
        icon: LayersIcon,
        iconColor: "blue",
        onClick: () => setIsAddCategoryOpen(true),
      },
      {
        id: "view-charts",
        label: activeTab === "charts" ? "View ledger" : "Expense charts",
        description: "Visual outflow breakdown",
        icon: PieChartIcon,
        iconColor: "purple",
        onClick: () =>
          setActiveTab((prev) => (prev === "charts" ? "data" : "charts")),
      },
      {
        id: "refresh-data",
        label: "Refresh",
        description: "Fetch latest records",
        icon: RefreshCwIcon,
        iconColor: "zinc",
        onClick: () => {
          void onRetry();
        },
      },
    ];
  }, [activeTab, onRetry]);

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
      {/* 1. Top Section: Directional Hero (7 cols) + Quick Actions & Pending Attention (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
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
            subtitle="Track household spending, bills, transport, and discretionary outflows."
            submetrics={submetrics}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
          <MoneyActionGrid
            title="Expense actions"
            description="Record payments, manage expense categories, and analyze outflows."
            actions={quickActions}
          />

          {pendingRecords.length > 0 ? (
            <MoneyPendingAttentionCard
              direction="expense"
              title="Pending Expenses"
              subtitle="Expenses currently awaiting approval or settlement."
              badgeCount={pendingRecords.length}
              items={pendingAttentionItems}
            />
          ) : null}
        </div>
      </div>

      {/* 2. Middle Section: Categories Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-12">
          <MoneyCategoryBreakdownCard
            direction="expense"
            title="Expense Categories & Breakdown"
            subtitle="Breakdown of food, housing, utilities, transport, and other costs."
            currency="RWF"
            items={categoryItems}
            activeCountLabel={`${categoryItems.length} active categories`}
            onAddCategory={() => setIsAddCategoryOpen(true)}
            addCategoryLabel="New expense category"
          />
        </div>
      </div>

      {/* 3. Transaction Ledger & Charts Tabs */}
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

      {/* Create Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create an expense category</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm
            defaultType="EXPENSE"
            existingCategories={allCategories ?? categories}
            familyId={familyId}
            personal
            onSuccess={async () => {
              setIsAddCategoryOpen(false);
              await onRetry();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Record Expense Dialog Triggered from Quick Action */}
      {familyId ? (
        <MoneyFormDialog
          categories={allCategories ?? categories}
          familyId={familyId}
          open={isRecordExpenseOpen}
          onOpenChange={setIsRecordExpenseOpen}
          onCategoryCreated={onRetry}
          onSuccess={onRetry}
          trigger={null}
          type="expense"
        />
      ) : null}

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
