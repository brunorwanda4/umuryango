"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import {
  DashboardGrid,
  DashboardShell,
} from "@/components/common/dashboard/dashboard-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createTranslator } from "@/i18n/translate";
import { FamilyWorkspacesCard } from "./family-workspaces-card";
import { LoansOverviewCard } from "./loans-overview-card";
import { MoneyOverviewCard } from "./money-overview-card";
import { PersonalDashboardHeader } from "./personal-dashboard-header";
import { usePersonalOverviewData } from "./personal-overview-data";
import { PersonalSummaryCards } from "./personal-summary-cards";
import { PlansOverviewCard } from "./plans-overview-card";
import { RecentActivityCard } from "./recent-activity-card";

export function PersonalOverviewPage() {
  const t = createTranslator("PersonalOverview");
  const { data, error, isLoading, reload } = usePersonalOverviewData();

  if (isLoading) return <PersonalOverviewSkeleton />;
  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{t((m) => m.PersonalOverview.errorLoad)}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => void reload()}
        >
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          {t((m) => m.PersonalOverview.tryAgain)}
        </Button>
      </div>
    );
  }

  const firstName = data.user?.fullName.split(" ")[0] || undefined;
  return (
    <DashboardShell>
      <PersonalDashboardHeader firstName={firstName} />
      {data.warnings.length > 0 ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{t((m) => m.PersonalOverview.warningsTitle)}</AlertTitle>
          <AlertDescription>
            {[...new Set(data.warnings)].join(" ")}
          </AlertDescription>
        </Alert>
      ) : null}
      <PersonalSummaryCards data={data} />
      <DashboardGrid>
        <MoneyOverviewCard data={data} onSuccess={reload} />
        <PlansOverviewCard plans={data.plans} />
        <FamilyWorkspacesCard families={data.families} />
        <LoansOverviewCard currency={data.currency} loans={data.loans} />
        <RecentActivityCard data={data} />
      </DashboardGrid>
    </DashboardShell>
  );
}

function PersonalOverviewSkeleton() {
  const t = createTranslator("PersonalOverview");

  return (
    <output
      className="mx-auto flex w-full max-w-6xl flex-col gap-5"
      aria-label={t((m) => m.PersonalOverview.loadingAria)}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </output>
  );
}
