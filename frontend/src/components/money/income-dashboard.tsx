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
      },
      {
        id: "largest-income",
        label: "Largest Inflow",
        value: data.summary.largestIncome?.amountMinorUnits ?? "0",
        variant: "neutral",
        indicatorColor: "purple",
      },
      {
        id: "record-count",
        label: "Recorded Inflows",
        value: data.summary.transactionCount,
        variant: "neutral",
        indicatorColor: "muted",
      },
    ];
  }, [data, pendingRecords.length, pendingTotal]);

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
            direction="income"
            currency="RWF"
            totalAmountMinorUnits={data.summary.periodTotalMinorUnits}
            eyebrowLabel="TOTAL INCOME RECEIVED (RWF)"
            periodBadge={
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {periodLabel ?? "This Month"}
              </span>
            }
            submetrics={submetrics}
          />
        </div>

        {pendingRecords.length > 0 ? (
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            <MoneyPendingAttentionCard
              direction="income"
              title="Pending & Expected Inflows"
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
