"use client";

import { AlertCircleIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  aggregateCategoryBreakdown,
  CashflowHeroCard,
  CategoryBreakdownCard,
  MoneyOverviewHeader,
  MoneyOverviewShell,
  MoneyOverviewTopGrid,
  MoneyPeriodSelector,
  type SharedCashFlowPoint,
  type SharedCategoryItem,
  type SharedMoneyPeriodOption,
  type SharedTransactionItem,
  TransactionLedgerCard,
} from "@/components/common/money-overview";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { MoneyApprovalTable } from "./money-approval-table";
import { MoneyOperationsGrid } from "./money-operations-grid";
import { MoneyRecordsTable } from "./money-records-table";
import type { FetchState, MoneyOverview, MoneyPeriod } from "./types";
import {
  formatCompactMinorUnits,
  formatDate,
  formatTitle,
  normalizeMoneyOverview,
  periodLabels,
} from "./utils";

export function FamilyMoneyWorkspace({ familyName }: { familyName: string }) {
  const t = createTranslator("FamilyMoney");
  const [period, setPeriod] = useState<MoneyPeriod>("month");
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    setState({ status: "loading" });

    (async () => {
      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!active) return;

      if (!familyResponse.ok || !familyResponse.data) {
        setState({
          status: "error",
          message:
            familyResponse.message ?? t((m) => m.FamilyMoney.loadErrorTitle),
        });
        return;
      }

      const family = familyResponse.data;
      const search = new URLSearchParams({ period });
      const moneyResponse = await apiRequest<undefined, MoneyOverview>(
        "get",
        `/families/${encodeURIComponent(family.id)}/money/overview?${search}`,
      );

      if (!active) return;

      setState({
        status: "success",
        family,
        money: moneyResponse.ok
          ? normalizeMoneyOverview(moneyResponse.data)
          : null,
        moneyMessage: moneyResponse.ok
          ? undefined
          : (moneyResponse.message ??
            t((m) => m.FamilyMoney.waitingForRecordsTitle)),
      });
    })();

    return () => {
      active = false;
    };
  }, [familyName, period, t]);

  if (state.status === "loading") {
    return <FamilyMoneySkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletCardsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t((m) => m.FamilyMoney.loadErrorTitle)}</EmptyTitle>
          <EmptyDescription>
            {t((m) => m.FamilyMoney.loadErrorDesc, { message: state.message })}{" "}
            <Link href="/family">{t((m) => m.FamilyMoney.backToFamilies)}</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MoneyWorkspaceContent
      family={state.family}
      money={state.money}
      moneyMessage={state.moneyMessage}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}

function MoneyWorkspaceContent({
  family,
  money,
  moneyMessage,
  period,
  onPeriodChange,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
  period: MoneyPeriod;
  onPeriodChange: (period: MoneyPeriod) => void;
}) {
  const t = createTranslator("FamilyMoney");
  const currency = money?.currency ?? family.defaultCurrency;

  const periodOptions: SharedMoneyPeriodOption[] = useMemo(
    () => [
      { value: "month", label: t((m) => m.FamilyMoney.periods.month) },
      { value: "quarter", label: t((m) => m.FamilyMoney.periods.quarter) },
      { value: "year", label: t((m) => m.FamilyMoney.periods.year) },
    ],
    [t],
  );

  const cashFlowPoints: SharedCashFlowPoint[] = useMemo(() => {
    return (money?.cashFlow ?? []).map((point) => ({
      label: point.label,
      incomeMinorUnits: point.incomeMinorUnits ?? 0,
      expenseMinorUnits: point.expenseMinorUnits ?? 0,
    }));
  }, [money?.cashFlow]);

  const expenseCategoryBreakdown: SharedCategoryItem[] = useMemo(() => {
    const expenseRecords = (money?.records ?? []).filter(
      (r) => r.type === "expense",
    );
    const totalExpense = money?.totals?.expenseMinorUnits ?? "0";
    return aggregateCategoryBreakdown(
      expenseRecords.map((r) => ({
        categoryId: r.category,
        categoryName: r.category,
        amountMinorUnits: r.amountMinorUnits,
      })),
      totalExpense,
    );
  }, [money?.records, money?.totals?.expenseMinorUnits]);

  const incomeCategoryBreakdown: SharedCategoryItem[] = useMemo(() => {
    const incomeRecords = (money?.records ?? []).filter(
      (r) => r.type === "income" || r.type === "contribution",
    );
    const totalIncome = money?.totals?.incomeMinorUnits ?? "0";
    if (incomeRecords.length > 0) {
      return aggregateCategoryBreakdown(
        incomeRecords.map((r) => ({
          categoryId: r.category,
          categoryName: r.category,
          amountMinorUnits: r.amountMinorUnits,
        })),
        totalIncome,
      );
    }
    const allocation = money?.allocation ?? [];
    return aggregateCategoryBreakdown(
      allocation.map((a) => ({
        categoryId: a.label,
        categoryName: a.label,
        amountMinorUnits: a.amountMinorUnits,
      })),
      totalIncome,
    );
  }, [money?.records, money?.allocation, money?.totals?.incomeMinorUnits]);

  const sharedTransactions: SharedTransactionItem[] = useMemo(() => {
    return (money?.records ?? []).map((record) => {
      const isIncome = record.type === "income";
      const isExpense = record.type === "expense";
      const isContribution = record.type === "contribution";

      return {
        id: record.id,
        title: record.title,
        subtitle: record.category
          ? `${record.category}${record.createdBy ? ` • by ${record.createdBy}` : ""}`
          : (record.createdBy ?? undefined),
        type: isIncome
          ? "income"
          : isExpense
            ? "expense"
            : isContribution
              ? "contribution"
              : "transfer",
        amountMinorUnits: String(record.amountMinorUnits ?? "0"),
        currency,
        date: formatDate(record.date),
        rawDate: record.date ?? undefined,
        status: formatTitle(record.status ?? "approved"),
        statusVariant:
          record.status === "verified" ||
          record.status === "approved" ||
          record.status === "completed"
            ? "success"
            : record.status === "pending"
              ? "pending"
              : "neutral",
        category: record.category,
        createdBy: record.createdBy,
      };
    });
  }, [money?.records, currency]);

  const pendingApprovalsCount =
    typeof money?.totals?.pendingApprovalCount === "number"
      ? money.totals.pendingApprovalCount
      : (money?.approvals?.length ?? 0);

  return (
    <MoneyOverviewShell>
      {/* Header */}
      <MoneyOverviewHeader
        title={t((m) => m.FamilyMoney.workspaceTitle)}
        description={t((m) => m.FamilyMoney.description)}
      />

      {/* Timeframe Pill Selector */}
      <div className="w-full sm:w-auto">
        <MoneyPeriodSelector
          options={periodOptions}
          value={period}
          onChange={(v) => onPeriodChange(v as MoneyPeriod)}
        />
      </div>

      {/* Partial Warning */}
      {moneyMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>
            {t((m) => m.FamilyMoney.waitingForRecordsTitle)}
          </AlertTitle>
          <AlertDescription>
            {t((m) => m.FamilyMoney.waitingForRecordsDesc, {
              detail: moneyMessage,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="gap-5">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">
              {t((m) => m.FamilyMoney.overviewTab)}
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-1.5">
              <span>{t((m) => m.FamilyMoney.approvalsTab)}</span>
              {pendingApprovalsCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] h-4 rounded-full font-bold"
                >
                  {pendingApprovalsCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="records">
              {t((m) => m.FamilyMoney.recordsTab)}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex flex-col gap-5 pt-1">
          {/* Top Grid: Hero Card + Category Breakdown */}
          <MoneyOverviewTopGrid>
            <div className="lg:col-span-8">
              <CashflowHeroCard
                label={t((m) => m.FamilyMoney.cashBalance)}
                badgeLabel={periodLabels[period]}
                netMinorUnits={String(
                  money?.totals?.cashBalanceMinorUnits ?? "0",
                )}
                incomeMinorUnits={String(
                  money?.totals?.incomeMinorUnits ?? "0",
                )}
                expenseMinorUnits={String(
                  money?.totals?.expenseMinorUnits ?? "0",
                )}
                currency={currency}
                incomeMeta={
                  money?.totals?.contributionsPaidMinorUnits
                    ? `Paid: ${formatCompactMinorUnits(money.totals.contributionsPaidMinorUnits, currency)}`
                    : undefined
                }
                cashFlowPoints={cashFlowPoints}
              />
            </div>

            <div className="lg:col-span-4">
              <CategoryBreakdownCard
                expenseCategories={expenseCategoryBreakdown}
                incomeCategories={incomeCategoryBreakdown}
                currency={currency}
              />
            </div>
          </MoneyOverviewTopGrid>

          {/* Operations Grid */}
          <MoneyOperationsGrid family={family} money={money} />

          {/* Recent Transactions Ledger */}
          <TransactionLedgerCard
            transactions={sharedTransactions}
            currency={currency}
            limit={12}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <MoneyApprovalTable
            currency={currency}
            money={money}
            familyId={family.id}
          />
        </TabsContent>

        <TabsContent value="records">
          <MoneyRecordsTable currency={currency} money={money} />
        </TabsContent>
      </Tabs>
    </MoneyOverviewShell>
  );
}
