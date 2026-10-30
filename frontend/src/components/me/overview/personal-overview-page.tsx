"use client";

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FamilyWorkspacesCard } from "./family-workspaces-card";
import { LoansOverviewCard } from "./loans-overview-card";
import { MoneyOverviewCard } from "./money-overview-card";
import { PersonalDashboardHeader } from "./personal-dashboard-header";
import { usePersonalOverviewData } from "./personal-overview-data";
import { PersonalSummaryCards } from "./personal-summary-cards";
import { PlansOverviewCard } from "./plans-overview-card";
import { RecentActivityCard } from "./recent-activity-card";

export function PersonalOverviewPage() {
  const { data, error, isLoading, reload } = usePersonalOverviewData();

  if (isLoading) return <PersonalOverviewSkeleton />;
  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Personal overview could not load</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" className="w-fit" onClick={() => void reload()}>
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  const firstName = data.user?.fullName.split(" ")[0] || undefined;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
      <PersonalDashboardHeader firstName={firstName} />
      {data.warnings.length > 0 ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Some information needs attention</AlertTitle>
          <AlertDescription>{[...new Set(data.warnings)].join(" ")}</AlertDescription>
        </Alert>
      ) : null}
      <PersonalSummaryCards data={data} />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <MoneyOverviewCard data={data} />
        <PlansOverviewCard plans={data.plans} />
        <FamilyWorkspacesCard families={data.families} />
        <LoansOverviewCard currency={data.currency} loans={data.loans} />
        <RecentActivityCard data={data} />
      </div>
    </div>
  );
}

function PersonalOverviewSkeleton() {
  const summarySkeletons = ["balance", "income", "expenses", "plans", "loans", "families"];
  const sectionSkeletons = ["money", "plans", "loans", "families", "activity", "actions"];

  return (
    <output
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      aria-label="Loading personal overview"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {summarySkeletons.map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {sectionSkeletons.map((item) => (
          <Skeleton key={item} className="h-96" />
        ))}
      </div>
    </output>
  );
}
