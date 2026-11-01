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
import { IncomeChartsSection } from "./income-dashboard/income-charts-section";
import {
  type IncomeCategory,
  type IncomeDashboardResponse,
  mapIncomeDashboard,
} from "./income-dashboard/income-dashboard-data";
import { RecentIncomeTable } from "./income-dashboard/recent-income-table";
import { ViewIncomeDialog } from "./income-dashboard/view-income-dialog";

export function IncomeDashboard({
  categories,
  allCategories,
  data,
  error,
  familyId,
  isLoading,
  onRetry,
  periodLabel,
}: {
  categories: IncomeCategory[];
  allCategories?: IncomeCategory[];
  data: IncomeDashboardResponse | null;
  error: string | null;
  familyId: string | null;
  isLoading: boolean;
  onRetry: () => void | Promise<void>;
  periodLabel?: string;
}) {
  const t = createTranslator("PersonalMoney.personalIncome");
  const [activeTab, setActiveTab] = useState("data");
  const [isRecordIncomeOpen, setIsRecordIncomeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [viewPendingIncomeId, setViewPendingIncomeId] = useState<string | null>(
    null,
  );

  const dashboard = useMemo(
    () => (data ? mapIncomeDashboard(data) : null),
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

  const selectedPendingIncome = useMemo(
    () =>
      dashboard?.recentIncomeData.find((inc) => inc.id === viewPendingIncomeId),
    [dashboard?.recentIncomeData, viewPendingIncomeId],
  );

  const submetrics = useMemo<MoneyHeroSubmetric[]>(() => {
    if (!data) return [];
    return [
      {
        id: "cleared-inflows",
        label: "Cleared Inflows",
        value: data.summary.periodTotalMinorUnits,
        variant: "income",
        indicatorColor: "emerald",
        countText: `${approvedRecords.length} completed payouts`,
      },
      {
        id: "pending-or-alltime",
        label:
          pendingRecords.length > 0 ? "Pending Inflows" : "All-Time Inflows",
        value:
          pendingRecords.length > 0
            ? pendingTotal
            : data.summary.allTimeTotalMinorUnits,
        variant: pendingRecords.length > 0 ? "pending" : "neutral",
        indicatorColor: pendingRecords.length > 0 ? "amber" : "blue",
        countText:
          pendingRecords.length > 0
            ? `${pendingRecords.length} awaiting settlement`
            : "Total all-time deposits",
      },
      {
        id: "largest-income",
        label: "Largest Inflow",
        value: data.summary.largestIncome?.amountMinorUnits ?? "0",
        variant: "neutral",
        indicatorColor: "purple",
        countText: data.summary.largestIncome?.category ?? "No records",
      },
      {
        id: "record-count",
        label: "Recorded Inflows",
        value: data.summary.transactionCount,
        variant: "neutral",
        indicatorColor: "muted",
        countText: `${data.summary.transactionCount} entries recorded`,
      },
    ];
  }, [data, approvedRecords.length, pendingRecords.length, pendingTotal]);

  const streamCategoryItems = useMemo<MoneyCategoryItem[]>(() => {
    if (!dashboard || !data) return [];
    return dashboard.incomeSourceData.map((source) => ({
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
      onAction: () => setViewPendingIncomeId(record.id),
      onView: () => setViewPendingIncomeId(record.id),
    }));
  }, [pendingRecords]);

  const quickActions = useMemo<MoneyActionItem[]>(() => {
    return [
      {
        id: "record-income",
        label: "Record income",
        description: "Log deposit or contract",
        icon: PlusCircleIcon,
        iconColor: "emerald",
        onClick: () => setIsRecordIncomeOpen(true),
      },
      {
        id: "add-category",
        label: "New category",
        description: "Organize inflow sources",
        icon: LayersIcon,
        iconColor: "blue",
        onClick: () => setIsAddCategoryOpen(true),
      },
      {
        id: "view-charts",
        label: activeTab === "charts" ? "View ledger" : "Inflow charts",
        description: "Visual allocation breakdown",
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
          {t((m) => m.PersonalMoney.personalIncome.loadError)}
        </AlertTitle>
        <AlertDescription>
          {error ?? t((m) => m.PersonalMoney.personalIncome.noWorkspace)}
        </AlertDescription>
        <Button
          className="mt-3 w-fit"
          onClick={onRetry}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon data-icon="inline-start" />
          {t((m) => m.PersonalMoney.personalIncome.tryAgain)}
        </Button>
      </Alert>
    );
  }

  if (!categories.length) {
    return (
      <div className="grid place-content-center w-full min-h-[400px]">
        <Alert className="flex flex-col gap-4 max-w-lg">
          <AlertTitle>
            {t((m) => m.PersonalMoney.personalIncome.createCategoryTitle)}
          </AlertTitle>
          <AlertDescription>
            {t((m) => m.PersonalMoney.personalIncome.createCategoryDesc)}
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
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* 1. Top Section: Directional Hero (7 cols) + Quick Actions & Pending Attention (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
          <MoneyDirectionalHero
            direction="income"
            currency="RWF"
            totalAmountMinorUnits={data.summary.periodTotalMinorUnits}
            eyebrowLabel="TOTAL INCOME RECEIVED (RWF)"
            periodBadge={
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {periodLabel ?? "This Month"}
              </span>
            }
            subtitle="Track salary, freelance contracts, dividends, and communal returns."
            submetrics={submetrics}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
          <MoneyActionGrid
            title="Inflow actions"
            description="Record payments, manage income categories, and analyze inflows."
            actions={quickActions}
          />

          {pendingRecords.length > 0 ? (
            <MoneyPendingAttentionCard
              direction="income"
              title="Pending & Expected Inflows"
              subtitle="Inflows awaiting client settlement or approval."
              badgeCount={pendingRecords.length}
              items={pendingAttentionItems}
            />
          ) : null}
        </div>
      </div>

      {/* 2. Middle Section: Streams & Sources Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-12">
          <MoneyCategoryBreakdownCard
            direction="income"
            title="Income Streams & Sources"
            subtitle="Breakdown of primary career, freelance gigs, and communal returns."
            currency="RWF"
            items={streamCategoryItems}
            activeCountLabel={`${streamCategoryItems.length} active streams`}
            onAddCategory={() => setIsAddCategoryOpen(true)}
            addCategoryLabel="New income category"
          />
        </div>
      </div>

      {/* 3. Transaction Ledger & Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="data">
            {t((m) => m.PersonalMoney.personalIncome.dataTab)}
          </TabsTrigger>
          <TabsTrigger value="charts">
            {t((m) => m.PersonalMoney.personalIncome.chartsTab)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <RecentIncomeTable
            categories={categories}
            data={dashboard.recentIncomeData}
            familyId={familyId}
            onSuccess={onRetry}
          />
        </TabsContent>

        <TabsContent value="charts" className="mt-4">
          <IncomeChartsSection
            overTime={dashboard.incomeOverTimeData}
            sources={dashboard.incomeSourceData}
            totalIncomeMinorUnits={dashboard.totalIncomeMinorUnits}
          />
        </TabsContent>
      </Tabs>

      {/* Create Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t((m) => m.PersonalMoney.personalIncome.createCategoryTitle)}
            </DialogTitle>
          </DialogHeader>
          <CreateCategoryForm
            defaultType="INCOME"
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

      {/* Record Income Dialog Triggered from Quick Action */}
      {familyId ? (
        <MoneyFormDialog
          categories={allCategories ?? categories}
          familyId={familyId}
          open={isRecordIncomeOpen}
          onOpenChange={setIsRecordIncomeOpen}
          onCategoryCreated={onRetry}
          onSuccess={onRetry}
          trigger={null}
          type="income"
        />
      ) : null}

      {/* Pending Income View Dialog */}
      {selectedPendingIncome ? (
        <ViewIncomeDialog
          categories={categories}
          familyId={familyId}
          income={selectedPendingIncome}
          open={Boolean(viewPendingIncomeId)}
          onOpenChange={(open) => {
            if (!open) setViewPendingIncomeId(null);
          }}
          trigger={null}
          onSuccess={onRetry}
        />
      ) : null}
    </div>
  );
}
