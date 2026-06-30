"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  FileBarChartIcon,
  FileClockIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ListChecksIcon,
  PieChartIcon,
  PrinterIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTHORITY_LABELS, hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";

type ReportPeriod = "month" | "quarter" | "year";
type ReportTypeFilter =
  | "all"
  | "money"
  | "contributions"
  | "projects"
  | "savings"
  | "debts"
  | "budgets";

type MoneyMinorValue = number | string;

type ReportsOverview = {
  currency?: string;
  generatedAt?: string;
  sourceRecordCount?: number;
  period?: {
    label?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
  totals?: ReportTotals;
  trend?: ReportTrendPoint[];
  breakdown?: ReportBreakdownPoint[];
  reports?: GeneratedReportRow[];
  sourceRecords?: ReportSourceRecordRow[];
  exports?: ReportExportRow[];
};

type ReportTotals = {
  cashBalanceMinorUnits?: MoneyMinorValue | null;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
  contributionsPaidMinorUnits?: MoneyMinorValue | null;
  savingsMinorUnits?: MoneyMinorValue | null;
  debtOutstandingMinorUnits?: MoneyMinorValue | null;
  projectPlannedMinorUnits?: MoneyMinorValue | null;
  reportCount?: number | null;
  exportCount?: number | null;
  pendingApprovalCount?: number | null;
};

type ReportTrendPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
  contributionsPaidMinorUnits?: MoneyMinorValue | null;
};

type ReportBreakdownPoint = {
  label: string;
  amountMinorUnits?: MoneyMinorValue | null;
};

type GeneratedReportRow = {
  id: string;
  title: string;
  type: string;
  periodLabel?: string | null;
  generatedAt?: string | null;
  generatedBy?: string | null;
  status?: string | null;
  sourceRecordCount?: number | null;
};

type ReportSourceRecordRow = {
  id: string;
  module: string;
  title: string;
  date?: string | null;
  status?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  createdBy?: string | null;
};

type ReportExportRow = {
  id: string;
  title: string;
  format: string;
  status?: string | null;
  requestedAt?: string | null;
  requestedBy?: string | null;
};

type MoneyOverview = {
  currency?: string;
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    cashBalanceMinorUnits?: MoneyMinorValue | null;
    incomeMinorUnits?: MoneyMinorValue | null;
    expenseMinorUnits?: MoneyMinorValue | null;
    contributionsPaidMinorUnits?: MoneyMinorValue | null;
    savingsMinorUnits?: MoneyMinorValue | null;
    debtOutstandingMinorUnits?: MoneyMinorValue | null;
    pendingApprovalCount?: number | null;
  };
  cashFlow?: MoneyCashFlowPoint[];
  allocation?: ReportBreakdownPoint[];
  records?: MoneyRecordRow[];
};

type MoneyCashFlowPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
};

type MoneyRecordRow = {
  id: string;
  type: string;
  title: string;
  date?: string | null;
  status?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  createdBy?: string | null;
};

type ContributionsOverview = {
  currency?: string;
  sourceRecordCount?: number;
  totals?: {
    collectedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    overdueMinorUnits?: MoneyMinorValue | null;
    collectionRatePercent?: number | null;
  };
};

type ProjectsOverview = {
  currency?: string;
  sourceRecordCount?: number;
  totals?: {
    plannedMinorUnits?: MoneyMinorValue | null;
    contributedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    activeProjectCount?: number | null;
  };
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      reports: ReportsOverview | null;
      reportsMessage?: string;
      money: MoneyOverview | null;
      moneyMessage?: string;
      contributions: ContributionsOverview | null;
      contributionsMessage?: string;
      projects: ProjectsOverview | null;
      projectsMessage?: string;
    };

const periodLabels: Record<ReportPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

const reportTypeLabels: Record<ReportTypeFilter, string> = {
  all: "All reports",
  money: "Money",
  contributions: "Contributions",
  projects: "Projects",
  savings: "Savings",
  debts: "Debts",
  budgets: "Budgets",
};

const trendConfig = {
  incomeMinorUnits: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenseMinorUnits: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  contributionsPaidMinorUnits: {
    label: "Contributions",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const breakdownConfig = {
  amountMinorUnits: {
    label: "Amount",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const summarySkeletonKeys = [
  "cash",
  "income",
  "expenses",
  "contributions",
  "savings",
  "debts",
];

const reportTypes: {
  type: ReportTypeFilter;
  title: string;
  description: string;
  icon: LucideIcon;
  hrefSegment?: string;
}[] = [
  {
    type: "money",
    title: "Money report",
    description: "Income, expenses, approvals, budgets, savings, and debts.",
    icon: WalletCardsIcon,
    hrefSegment: "money",
  },
  {
    type: "contributions",
    title: "Contribution report",
    description: "Expected, paid, overdue, and member contribution progress.",
    icon: HandCoinsIcon,
    hrefSegment: "contributions",
  },
  {
    type: "projects",
    title: "Project report",
    description: "Project budgets, contributions, milestones, and owners.",
    icon: FolderKanbanIcon,
    hrefSegment: "projects",
  },
  {
    type: "savings",
    title: "Savings report",
    description: "Family saving targets, balances, milestones, and movement.",
    icon: TargetIcon,
  },
  {
    type: "debts",
    title: "Debt report",
    description: "Borrowed and lent balances, due dates, and repayments.",
    icon: LandmarkIcon,
  },
  {
    type: "budgets",
    title: "Budget report",
    description: "Approved spending against family category limits.",
    icon: ListChecksIcon,
  },
];

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

function ReportsHeader({
  canExportReports,
  currency,
  family,
  hasSourceRecords,
}: {
  canExportReports: boolean;
  currency: string;
  family: FamilyDetail;
  hasSourceRecords: boolean;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Family reports
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Review {family.name} reports across money, contributions, savings,
            debts, budgets, and projects. Values are shown only from persisted
            family records returned by the API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canExportReports ? (
            <>
              <Button
                disabled
                size="sm"
                title="PDF generation needs the backend export job."
              >
                <PrinterIcon aria-hidden="true" data-icon="inline-start" />
                PDF
              </Button>
              <Button
                disabled
                size="sm"
                title="Excel export needs the backend export job."
                variant="outline"
              >
                <FileSpreadsheetIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                Excel
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.name}</Badge>
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{currency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}

function ReportsFilters({
  onPeriodChange,
  onReportTypeChange,
  period,
  periodLabel,
  reportType,
}: {
  onPeriodChange: (period: ReportPeriod) => void;
  onReportTypeChange: (reportType: ReportTypeFilter) => void;
  period: ReportPeriod;
  periodLabel: string;
  reportType: ReportTypeFilter;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Report filters</p>
          <p className="text-muted-foreground text-xs">
            Current view: {periodLabel}, {reportTypeLabels[reportType]}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={period}
          onValueChange={(value) => onPeriodChange(value as ReportPeriod)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Report period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">This quarter</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={reportType}
          onValueChange={(value) =>
            onReportTypeChange(value as ReportTypeFilter)
          }
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Report type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reports</SelectItem>
            <SelectItem value="money">Money</SelectItem>
            <SelectItem value="contributions">Contributions</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="debts">Debts</SelectItem>
            <SelectItem value="budgets">Budgets</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

function SourceWarning({
  contributionsMessage,
  moneyMessage,
  projectsMessage,
}: {
  contributionsMessage?: string;
  moneyMessage?: string;
  projectsMessage?: string;
}) {
  const messages = [
    moneyMessage ? `Money: ${moneyMessage}` : null,
    contributionsMessage ? `Contributions: ${contributionsMessage}` : null,
    projectsMessage ? `Projects: ${projectsMessage}` : null,
  ].filter(Boolean);

  return (
    <Alert>
      <FileClockIcon aria-hidden="true" />
      <AlertTitle>Some source modules are not ready</AlertTitle>
      <AlertDescription>
        Reports can only include modules returned by the backend.{" "}
        {messages.join(" ")}
      </AlertDescription>
    </Alert>
  );
}

function ReportMetricCards({
  contributions,
  currency,
  money,
  projects,
  reports,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
  money: MoneyOverview | null;
  projects: ProjectsOverview | null;
  reports: ReportsOverview | null;
}) {
  const totals = reports?.totals;
  const cards: {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
  }[] = [
    {
      title: "Cash balance",
      value: formatOptionalMoney(
        totals?.cashBalanceMinorUnits ?? money?.totals?.cashBalanceMinorUnits,
        currency,
      ),
      description: "Server-approved family position",
      icon: WalletCardsIcon,
    },
    {
      title: "Income",
      value: formatOptionalMoney(
        totals?.incomeMinorUnits ?? money?.totals?.incomeMinorUnits,
        currency,
      ),
      description: "Approved money received",
      icon: ReceiptTextIcon,
    },
    {
      title: "Expenses",
      value: formatOptionalMoney(
        totals?.expenseMinorUnits ?? money?.totals?.expenseMinorUnits,
        currency,
      ),
      description: "Approved money spent",
      icon: PieChartIcon,
    },
    {
      title: "Contributions",
      value: formatOptionalMoney(
        totals?.contributionsPaidMinorUnits ??
          money?.totals?.contributionsPaidMinorUnits ??
          contributions?.totals?.collectedMinorUnits,
        currency,
      ),
      description: "Verified family commitments",
      icon: HandCoinsIcon,
    },
    {
      title: "Savings",
      value: formatOptionalMoney(
        totals?.savingsMinorUnits ?? money?.totals?.savingsMinorUnits,
        currency,
      ),
      description: "Saved toward family goals",
      icon: TargetIcon,
    },
    {
      title: "Debts",
      value: formatOptionalMoney(
        totals?.debtOutstandingMinorUnits ??
          money?.totals?.debtOutstandingMinorUnits,
        currency,
      ),
      description: "Outstanding borrowed or lent money",
      icon: LandmarkIcon,
    },
    {
      title: "Project budgets",
      value: formatOptionalMoney(
        totals?.projectPlannedMinorUnits ?? projects?.totals?.plannedMinorUnits,
        currency,
      ),
      description: "Approved target amounts across projects",
      icon: FolderKanbanIcon,
    },
    {
      title: "Generated reports",
      value:
        typeof totals?.reportCount === "number"
          ? totals.reportCount.toLocaleString()
          : typeof reports?.reports?.length === "number"
            ? reports.reports.length.toLocaleString()
            : "No records",
      description: "Reports returned by the API",
      icon: FileBarChartIcon,
    },
  ];

  return (
    <section
      aria-label="Family reports summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-xl">
                  {card.value}
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs leading-5">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function ReportsCharts({
  currency,
  money,
  reports,
}: {
  currency: string;
  money: MoneyOverview | null;
  reports: ReportsOverview | null;
}) {
  const trend = useMemo(() => getTrendData(reports, money), [reports, money]);
  const breakdown = useMemo(
    () => getBreakdownData(reports, money),
    [reports, money],
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Money movement</CardTitle>
          <CardDescription>
            Approved report or money overview records for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length ? (
            <ChartContainer config={trendConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={trend}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={(value) =>
                    formatCompactMinorUnits(value, currency)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <>
                          <span className="text-muted-foreground">
                            {getTrendLabel(String(name))}
                          </span>
                          <span className="font-mono font-medium">
                            {formatMinorUnits(value, currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="incomeMinorUnits"
                  type="monotone"
                  fill="var(--color-incomeMinorUnits)"
                  fillOpacity={0.18}
                  stroke="var(--color-incomeMinorUnits)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="expenseMinorUnits"
                  type="monotone"
                  fill="var(--color-expenseMinorUnits)"
                  fillOpacity={0.12}
                  stroke="var(--color-expenseMinorUnits)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="contributionsPaidMinorUnits"
                  type="monotone"
                  fill="var(--color-contributionsPaidMinorUnits)"
                  fillOpacity={0.1}
                  stroke="var(--color-contributionsPaidMinorUnits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              description="Approved income, expense, and contribution records will draw this chart."
              icon={BarChart3Icon}
              title="No report trend data"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report breakdown</CardTitle>
          <CardDescription>
            Money categories or allocation returned by the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown.length ? (
            <ChartContainer config={breakdownConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={breakdown} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatCompactMinorUnits(value, currency)
                  }
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={104}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <>
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-mono font-medium">
                            {formatMinorUnits(value, currency)}
                          </span>
                        </>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="amountMinorUnits"
                  fill="var(--color-amountMinorUnits)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              description="Savings, debts, contributions, budgets, and projects will appear here after the API returns them."
              icon={PieChartIcon}
              title="No breakdown data"
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ReportOperationsGrid({
  canExportReports,
  family,
  hasSourceRecords,
  reports,
}: {
  canExportReports: boolean;
  family: FamilyDetail;
  hasSourceRecords: boolean;
  reports: ReportsOverview | null;
}) {
  const totals = reports?.totals;
  const items: {
    title: string;
    description: string;
    value: string;
    icon: LucideIcon;
  }[] = [
    {
      title: "Report permission",
      description: "Backend must authorize every protected report action.",
      value: hasCapability(family, "VIEW_REPORTS") ? "Allowed" : "View only",
      icon: ShieldCheckIcon,
    },
    {
      title: "Report source",
      description: "Generated from persisted family records only.",
      value: `${getSourceRecordCount(reports).toLocaleString()} records`,
      icon: CheckCircle2Icon,
    },
    {
      title: "Pending approvals",
      description: "Draft or rejected financial records stay out of reports.",
      value:
        typeof totals?.pendingApprovalCount === "number"
          ? totals.pendingApprovalCount.toLocaleString()
          : "No queue",
      icon: FileClockIcon,
    },
    {
      title: "Export readiness",
      description: "PDF and Excel exports need permission and source records.",
      value: canExportReports && hasSourceRecords ? "Ready" : "Restricted",
      icon: DownloadIcon,
    },
  ];

  return (
    <section
      aria-label="Report operations"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl tracking-tight">
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function ReportTypesGrid({
  canExportReports,
  family,
  hasSourceRecords,
  reports,
}: {
  canExportReports: boolean;
  family: FamilyDetail;
  hasSourceRecords: boolean;
  reports: ReportsOverview | null;
}) {
  return (
    <section
      aria-label="Available report types"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"
    >
      {reportTypes.map((reportType) => {
        const Icon = reportType.icon;
        const recentReport = findRecentReport(reports, reportType.type);

        return (
          <Card key={reportType.type}>
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardTitle>{reportType.title}</CardTitle>
              <CardDescription>{reportType.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReportFact
                  label="Status"
                  value={
                    recentReport?.status
                      ? formatTitle(recentReport.status)
                      : "Not generated"
                  }
                />
                <ReportFact
                  label="Last generated"
                  value={formatDateTime(recentReport?.generatedAt)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {reportType.hrefSegment ? (
                  <Button
                    href={`/family/${encodeURIComponent(family.slug)}/${reportType.hrefSegment}`}
                    size="sm"
                    variant="outline"
                  >
                    <EyeIcon aria-hidden="true" data-icon="inline-start" />
                    View source
                  </Button>
                ) : null}
                <Button
                  disabled={!canExportReports || !hasSourceRecords}
                  size="sm"
                  title="Report generation needs the backend report export workflow."
                >
                  <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function SourceRecordsTable({
  currency,
  money,
  reports,
}: {
  currency: string;
  money: MoneyOverview | null;
  reports: ReportsOverview | null;
}) {
  const records = useMemo(
    () => getSourceRecords(reports, money),
    [reports, money],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source records</CardTitle>
        <CardDescription>
          Persisted records used by report previews and generated files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={`${record.module}-${record.id}`}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{record.title}</span>
                      <span className="text-muted-foreground text-xs">
                        Created by {record.createdBy ?? "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatTitle(record.module)}</TableCell>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <StatusBadge value={record.status ?? "recorded"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(record.amountMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            description="Income, expenses, contribution payments, savings movements, debts, budgets, projects, and generated report inputs will appear here."
            icon={ReceiptTextIcon}
            title="No source records returned"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ExportsTable({
  canExportReports,
  hasSourceRecords,
  reports,
}: {
  canExportReports: boolean;
  hasSourceRecords: boolean;
  reports: ReportsOverview | null;
}) {
  const exports = reports?.exports ?? [];

  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Button
            disabled={!canExportReports || !hasSourceRecords}
            size="sm"
            title="Exports require backend jobs and report export permission."
          >
            <DownloadIcon aria-hidden="true" data-icon="inline-start" />
            New export
          </Button>
        </CardAction>
        <CardTitle>Report exports</CardTitle>
        <CardDescription>
          PDF, Excel, and print jobs requested for this family.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exports.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Export</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exportRow) => (
                <TableRow key={exportRow.id}>
                  <TableCell className="font-medium">
                    {exportRow.title}
                  </TableCell>
                  <TableCell>{formatTitle(exportRow.format)}</TableCell>
                  <TableCell>{exportRow.requestedBy ?? "Unknown"}</TableCell>
                  <TableCell>{formatDateTime(exportRow.requestedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={exportRow.status ?? "queued"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            description="Generated PDF and Excel export jobs will appear here after the backend report workflow saves them."
            icon={FileSpreadsheetIcon}
            title="No report exports returned"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <Badge variant="outline">{formatTitle(value)}</Badge>;
}

function ChartEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

function TableEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

function FamilyReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-3xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summarySkeletonKeys.map((key) => (
          <Skeleton className="h-36 w-full" key={key} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

function normalizeReportsOverview(
  reports?: ReportsOverview,
): ReportsOverview | null {
  if (!reports) {
    return null;
  }

  return {
    ...reports,
    breakdown: Array.isArray(reports.breakdown) ? reports.breakdown : [],
    exports: Array.isArray(reports.exports) ? reports.exports : [],
    reports: Array.isArray(reports.reports) ? reports.reports : [],
    sourceRecords: Array.isArray(reports.sourceRecords)
      ? reports.sourceRecords
      : [],
    trend: Array.isArray(reports.trend) ? reports.trend : [],
  };
}

function normalizeMoneyOverview(money?: MoneyOverview): MoneyOverview | null {
  if (!money) {
    return null;
  }

  return {
    ...money,
    allocation: Array.isArray(money.allocation) ? money.allocation : [],
    cashFlow: Array.isArray(money.cashFlow) ? money.cashFlow : [],
    records: Array.isArray(money.records) ? money.records : [],
  };
}

function normalizeContributionsOverview(
  contributions?: ContributionsOverview,
): ContributionsOverview | null {
  return contributions ?? null;
}

function normalizeProjectsOverview(
  projects?: ProjectsOverview,
): ProjectsOverview | null {
  return projects ?? null;
}

function getTrendData(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportTrend = reports?.trend ?? [];

  if (reportTrend.length) {
    return reportTrend.map((point) => ({
      ...point,
      contributionsPaidMinorUnits: toChartNumber(
        point.contributionsPaidMinorUnits,
      ),
      expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
      incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
    }));
  }

  return (money?.cashFlow ?? []).map((point) => ({
    ...point,
    contributionsPaidMinorUnits: 0,
    expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
    incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
  }));
}

function getBreakdownData(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportBreakdown = reports?.breakdown ?? [];

  if (reportBreakdown.length) {
    return reportBreakdown.map((point) => ({
      ...point,
      amountMinorUnits: toChartNumber(point.amountMinorUnits),
    }));
  }

  return (money?.allocation ?? []).map((point) => ({
    ...point,
    amountMinorUnits: toChartNumber(point.amountMinorUnits),
  }));
}

function getSourceRecords(
  reports: ReportsOverview | null,
  money: MoneyOverview | null,
) {
  const reportRecords = reports?.sourceRecords ?? [];

  if (reportRecords.length) {
    return reportRecords;
  }

  return (money?.records ?? []).map((record) => ({
    id: record.id,
    module: record.type,
    title: record.title,
    date: record.date,
    status: record.status,
    amountMinorUnits: record.amountMinorUnits,
    createdBy: record.createdBy,
  }));
}

function findRecentReport(
  reports: ReportsOverview | null,
  reportType: ReportTypeFilter,
) {
  return (reports?.reports ?? []).find(
    (report) => normalizeKey(report.type) === reportType,
  );
}

function getSourceRecordCount(
  source:
    | ReportsOverview
    | MoneyOverview
    | ContributionsOverview
    | ProjectsOverview
    | null,
) {
  return typeof source?.sourceRecordCount === "number"
    ? source.sourceRecordCount
    : 0;
}

function getTrendLabel(value: string) {
  if (value === "incomeMinorUnits") {
    return "Income";
  }

  if (value === "expenseMinorUnits") {
    return "Expenses";
  }

  if (value === "contributionsPaidMinorUnits") {
    return "Contributions";
  }

  return formatTitle(value);
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "_");
}

function formatOptionalMoney(
  value: MoneyMinorValue | null | undefined,
  currency: string,
) {
  if (value === null || value === undefined) {
    return "No records";
  }

  return formatMinorUnits(value, currency);
}

function formatMinorUnits(value: unknown, currency: string) {
  const normalized = normalizeMinorUnitString(value);

  if (!normalized) {
    return `${currency} ${String(value)}`;
  }

  const digits = getCurrencyFractionDigits(currency);
  const negative = normalized.startsWith("-");
  const absolute = negative ? normalized.slice(1) : normalized;

  if (digits === 0) {
    return `${negative ? "-" : ""}${currency} ${groupDigits(absolute)}`;
  }

  const padded = absolute.padStart(digits + 1, "0");
  const major = padded.slice(0, -digits);
  const minor = padded.slice(-digits);

  return `${negative ? "-" : ""}${currency} ${groupDigits(major)}.${minor}`;
}

function formatCompactMinorUnits(value: unknown, currency: string) {
  const numeric = toChartNumber(value);
  const digits = getCurrencyFractionDigits(currency);
  const divisor = 10 ** digits;
  const major = numeric / divisor;

  return `${currency} ${Intl.NumberFormat("en", {
    compactDisplay: "short",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(major)}`;
}

function normalizeMinorUnitString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return value;
  }

  return null;
}

function getCurrencyFractionDigits(currency: string) {
  try {
    const maximumFractionDigits = new Intl.NumberFormat("en", {
      currency,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;

    return typeof maximumFractionDigits === "number"
      ? maximumFractionDigits
      : 2;
  } catch {
    return 2;
  }
}

function groupDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toChartNumber(value: unknown) {
  const numeric = typeof value === "string" ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : 0;
}

function formatTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not dated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not generated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
