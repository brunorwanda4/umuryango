"use client";

import { AlertCircleIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { MoneyApprovalTable } from "./money-approval-table";
import { MoneyCharts } from "./money-charts";
import { MoneyFilters } from "./money-filters";
import { MoneyMetricCards } from "./money-metric-cards";
import { MoneyOperationsGrid } from "./money-operations-grid";
import { MoneyRecordsTable } from "./money-records-table";
import type { FetchState, MoneyOverview, MoneyPeriod } from "./types";
import { normalizeMoneyOverview, periodLabels } from "./utils";

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
          message: familyResponse.message ?? t("loadErrorTitle"),
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
          : (moneyResponse.message ?? t("waitingForRecordsTitle")),
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
          <EmptyTitle>{t("loadErrorTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("loadErrorDesc", { message: state.message })}{" "}
            <Link href="/family">{t("backToFamilies")}</Link>
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
  const periodLabel = money?.period?.label ?? periodLabels[period];

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t("workspaceTitle")} />
      <Separator />
      <MoneyFilters
        period={period}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
      />
      {moneyMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{t("waitingForRecordsTitle")}</AlertTitle>
          <AlertDescription>
            {t("waitingForRecordsDesc", { detail: moneyMessage })}
          </AlertDescription>
        </Alert>
      ) : null}
      <MoneyMetricCards
        currency={currency}
        familySlug={family.slug}
        money={money}
      />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">{t("overviewTab")}</TabsTrigger>
            <TabsTrigger value="approvals">{t("approvalsTab")}</TabsTrigger>
            <TabsTrigger value="records">{t("recordsTab")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <MoneyCharts currency={currency} money={money} />
          <MoneyOperationsGrid family={family} money={money} />
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
    </div>
  );
}
