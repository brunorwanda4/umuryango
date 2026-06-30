"use client";

import { AlertCircleIcon, FileBarChartIcon } from "lucide-react";
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

import { ExportsTable } from "./exports-table";
import { FamilyReportsSkeleton } from "./family-reports-skeleton";
import { ReportMetricCards } from "./report-metric-cards";
import { ReportOperationsGrid } from "./report-operations-grid";
import { ReportTypesGrid } from "./report-types-grid";
import { ReportsCharts } from "./reports-charts";
import { ReportsFilters } from "./reports-filters";
import { ReportsHeader } from "./reports-header";
import { SourceRecordsTable } from "./source-records-table";
import { SourceWarning } from "./source-warning";
import type {
  ContributionsOverview,
  FetchState,
  MoneyOverview,
  ProjectsOverview,
  ReportPeriod,
  ReportTypeFilter,
  ReportsOverview,
} from "./types";
import {
  getSourceRecordCount,
  normalizeContributionsOverview,
  normalizeMoneyOverview,
  normalizeProjectsOverview,
  normalizeReportsOverview,
  periodLabels,
} from "./utils";

export function FamilyReportsWorkspace({ familyName }: { familyName: string }) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [reportType, setReportType] = useState<ReportTypeFilter>("all");
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

      if (!hasCapability(family, "VIEW_REPORTS")) {
        setState({
          status: "success",
          family,
          reports: null,
          reportsMessage:
            "Your current family role cannot view report data for this workspace.",
          money: null,
          contributions: null,
          projects: null,
        });
        return;
      }

      const reportsSearch = new URLSearchParams({
        period,
        type: reportType,
      });
      const sourceSearch = new URLSearchParams({ period });
      const projectsSearch = new URLSearchParams({ status: "all" });

      const [
        reportsResponse,
        moneyResponse,
        contributionsResponse,
        projectsResponse,
      ] = await Promise.all([
        apiRequest<undefined, ReportsOverview>(
          "get",
          `/families/${encodeURIComponent(family.id)}/reports/overview?${reportsSearch}`,
        ),
        apiRequest<undefined, MoneyOverview>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/overview?${sourceSearch}`,
        ),
        apiRequest<undefined, ContributionsOverview>(
          "get",
          `/families/${encodeURIComponent(family.id)}/contributions/overview?${sourceSearch}`,
        ),
        apiRequest<undefined, ProjectsOverview>(
          "get",
          `/families/${encodeURIComponent(family.id)}/projects/overview?${projectsSearch}`,
        ),
      ]);

      if (!active) return;

      setState({
        status: "success",
        family,
        reports: reportsResponse.ok
          ? normalizeReportsOverview(reportsResponse.data)
          : null,
        reportsMessage: reportsResponse.ok
          ? undefined
          : (reportsResponse.message ??
            "Report records are not available from the API yet."),
        money: moneyResponse.ok
          ? normalizeMoneyOverview(moneyResponse.data)
          : null,
        moneyMessage: moneyResponse.ok
          ? undefined
          : (moneyResponse.message ??
            "Money records are not available from the API yet."),
        contributions: contributionsResponse.ok
          ? normalizeContributionsOverview(contributionsResponse.data)
          : null,
        contributionsMessage: contributionsResponse.ok
          ? undefined
          : (contributionsResponse.message ??
            "Contribution records are not available from the API yet."),
        projects: projectsResponse.ok
          ? normalizeProjectsOverview(projectsResponse.data)
          : null,
        projectsMessage: projectsResponse.ok
          ? undefined
          : (projectsResponse.message ??
            "Project records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [familyName, period, reportType]);

  if (state.status === "loading") {
    return <FamilyReportsSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileBarChartIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family reports could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ReportsWorkspaceContent
      contributions={state.contributions}
      contributionsMessage={state.contributionsMessage}
      family={state.family}
      money={state.money}
      moneyMessage={state.moneyMessage}
      onPeriodChange={setPeriod}
      onReportTypeChange={setReportType}
      period={period}
      projects={state.projects}
      projectsMessage={state.projectsMessage}
      reports={state.reports}
      reportsMessage={state.reportsMessage}
      reportType={reportType}
    />
  );
}

function ReportsWorkspaceContent({
  contributions,
  contributionsMessage,
  family,
  money,
  moneyMessage,
  onPeriodChange,
  onReportTypeChange,
  period,
  projects,
  projectsMessage,
  reports,
  reportsMessage,
  reportType,
}: {
  contributions: ContributionsOverview | null;
  contributionsMessage?: string;
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
  onPeriodChange: (period: ReportPeriod) => void;
  onReportTypeChange: (reportType: ReportTypeFilter) => void;
  period: ReportPeriod;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  reports: ReportsOverview | null;
  reportsMessage?: string;
  reportType: ReportTypeFilter;
}) {
  const currency =
    reports?.currency ??
    money?.currency ??
    contributions?.currency ??
    projects?.currency ??
    family.defaultCurrency;
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");
  const hasSourceRecords =
    getSourceRecordCount(reports) > 0 ||
    getSourceRecordCount(money) > 0 ||
    getSourceRecordCount(contributions) > 0 ||
    getSourceRecordCount(projects) > 0;
  const periodLabel = reports?.period?.label ?? periodLabels[period];

  return (
    <div className="flex flex-col gap-6">
      <ReportsHeader
        canExportReports={canExportReports}
        currency={currency}
        family={family}
        hasSourceRecords={hasSourceRecords}
      />
      <Separator />
      <ReportsFilters
        onPeriodChange={onPeriodChange}
        onReportTypeChange={onReportTypeChange}
        period={period}
        periodLabel={periodLabel}
        reportType={reportType}
      />
      {reportsMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for report records</AlertTitle>
          <AlertDescription>
            The reports page is ready to show generated reports, source records,
            exports, and charts. Report totals stay empty until the backend
            returns persisted report data. API detail: {reportsMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      {moneyMessage || contributionsMessage || projectsMessage ? (
        <SourceWarning
          contributionsMessage={contributionsMessage}
          moneyMessage={moneyMessage}
          projectsMessage={projectsMessage}
        />
      ) : null}
      <ReportMetricCards
        contributions={contributions}
        currency={currency}
        money={money}
        projects={projects}
        reports={reports}
      />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="types">Report types</TabsTrigger>
            <TabsTrigger value="records">Source records</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <ReportsCharts currency={currency} money={money} reports={reports} />
          <ReportOperationsGrid
            canExportReports={canExportReports}
            family={family}
            hasSourceRecords={hasSourceRecords}
            reports={reports}
          />
        </TabsContent>
        <TabsContent value="types">
          <ReportTypesGrid
            canExportReports={canExportReports}
            family={family}
            hasSourceRecords={hasSourceRecords}
            reports={reports}
          />
        </TabsContent>
        <TabsContent value="records">
          <SourceRecordsTable
            currency={currency}
            money={money}
            reports={reports}
          />
        </TabsContent>
        <TabsContent value="exports">
          <ExportsTable
            canExportReports={canExportReports}
            hasSourceRecords={hasSourceRecords}
            reports={reports}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
