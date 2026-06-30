"use client";

import { AlertCircleIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";

import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { MoneyApprovalTable } from "./money-approval-table";
import { MoneyBudgetList } from "./money-budget-list";
import { MoneyCharts } from "./money-charts";
import { MoneyFilters } from "./money-filters";
import { MoneyHeader } from "./money-header";
import { MoneyMetricCards } from "./money-metric-cards";
import { MoneyOperationsGrid } from "./money-operations-grid";
import { MoneyRecordsTable } from "./money-records-table";
import type { FetchState, MoneyOverview, MoneyPeriod } from "./types";
import { normalizeMoneyOverview, periodLabels } from "./utils";

export function FamilyMoneyWorkspace({ familyName }: { familyName: string }) {
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
          message: familyResponse.message ?? "Unable to load this family.",
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
            "Money records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [familyName, period]);

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
          <EmptyTitle>Family money could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
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
  const currency = money?.currency ?? family.defaultCurrency;
  const hasSourceRecords = Boolean(money && (money.sourceRecordCount ?? 0) > 0);
  const canRecordIncome = hasCapability(family, "RECORD_INCOME");
  const canRecordExpense = hasCapability(family, "RECORD_EXPENSE");
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");
  const periodLabel = money?.period?.label ?? periodLabels[period];

  return (
    <div className="flex flex-col gap-6">
      <MoneyHeader
        canExportReports={canExportReports}
        canRecordExpense={canRecordExpense}
        canRecordIncome={canRecordIncome}
        currency={currency}
        family={family}
        hasSourceRecords={hasSourceRecords}
      />
      <Separator />
      <MoneyFilters
        period={period}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
      />
      {moneyMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved money records</AlertTitle>
          <AlertDescription>
            This screen is ready for income, expenses, contributions, savings,
            debts, budgets, and approvals. Charts and totals stay empty until
            the backend returns persisted family money records. API detail:{" "}
            {moneyMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      <MoneyMetricCards currency={currency} money={money} />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <MoneyCharts currency={currency} money={money} />
          <MoneyOperationsGrid family={family} money={money} />
        </TabsContent>
        <TabsContent value="approvals">
          <MoneyApprovalTable currency={currency} money={money} />
        </TabsContent>
        <TabsContent value="budgets">
          <MoneyBudgetList currency={currency} money={money} />
        </TabsContent>
        <TabsContent value="records">
          <MoneyRecordsTable currency={currency} money={money} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
