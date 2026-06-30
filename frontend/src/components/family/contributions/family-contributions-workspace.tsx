"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircleIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CoinsIcon,
  DownloadIcon,
  FileClockIcon,
  FilterIcon,
  HandCoinsIcon,
  ListChecksIcon,
  PercentIcon,
  PiggyBankIcon,
  PlusIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  UsersRoundIcon,
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
import { CommonDataTable } from "@/components/common/table/common-data-table";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AUTHORITY_LABELS,
  type FamilyCapability,
  hasCapability,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

type ContributionPeriod = "month" | "quarter" | "year";

type MoneyMinorValue = number | string;

type ContributionsOverview = {
  currency?: string;
  period?: {
    label?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    expectedMinorUnits?: MoneyMinorValue | null;
    collectedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    overdueMinorUnits?: MoneyMinorValue | null;
    collectionRatePercent?: number | null;
    contributorsPaid?: number | null;
    contributorsExpected?: number | null;
    activePlanCount?: number | null;
    pendingVerificationCount?: number | null;
    overdueContributorCount?: number | null;
  };
  trend?: ContributionTrendPoint[];
  statusBreakdown?: ContributionStatusPoint[];
  plans?: ContributionPlanRow[];
  cycles?: ContributionCycleRow[];
  members?: ContributionMemberRow[];
  payments?: ContributionPaymentRow[];
};

type ContributionTrendPoint = {
  label: string;
  collectedMinorUnits?: MoneyMinorValue | null;
  expectedMinorUnits?: MoneyMinorValue | null;
};

type ContributionStatusPoint = {
  label: string;
  amountMinorUnits?: MoneyMinorValue | null;
};

type ContributionPlanRow = {
  id?: string;
  name: string;
  cadence?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  collectedMinorUnits?: MoneyMinorValue | null;
  expectedMinorUnits?: MoneyMinorValue | null;
  contributorCount?: number | null;
  status?: string | null;
};

type ContributionCycleRow = {
  id?: string;
  label: string;
  dueDate?: string | null;
  collectedMinorUnits?: MoneyMinorValue | null;
  expectedMinorUnits?: MoneyMinorValue | null;
  percentCollected?: number | null;
  status?: string | null;
};

type ContributionMemberRow = {
  id: string;
  fullName: string;
  expectedMinorUnits?: MoneyMinorValue | null;
  paidMinorUnits?: MoneyMinorValue | null;
  outstandingMinorUnits?: MoneyMinorValue | null;
  lastPaymentDate?: string | null;
  status?: string | null;
};

type ContributionPaymentRow = {
  id: string;
  contributor: string;
  planName?: string | null;
  method?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  date?: string | null;
  status?: string | null;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      contributions: ContributionsOverview | null;
      contributionsMessage?: string;
    };

const periodLabels: Record<ContributionPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

const trendConfig = {
  collectedMinorUnits: {
    label: "Collected",
    color: "var(--chart-4)",
  },
  expectedMinorUnits: {
    label: "Expected",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const statusConfig = {
  amountMinorUnits: {
    label: "Amount",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const summarySkeletonKeys = [
  "expected",
  "collected",
  "outstanding",
  "overdue",
  "rate",
  "contributors",
];

export function FamilyContributionsWorkspace({
  familyName,
}: {
  familyName: string;
}) {
  const [period, setPeriod] = useState<ContributionPeriod>("month");
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
      const contributionsResponse = await apiRequest<
        undefined,
        ContributionsOverview
      >(
        "get",
        `/families/${encodeURIComponent(family.id)}/contributions/overview?${search}`,
      );

      if (!active) return;

      setState({
        status: "success",
        family,
        contributions: contributionsResponse.ok
          ? normalizeContributionsOverview(contributionsResponse.data)
          : null,
        contributionsMessage: contributionsResponse.ok
          ? undefined
          : (contributionsResponse.message ??
            "Contribution records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [familyName, period]);

  if (state.status === "loading") {
    return <FamilyContributionsSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HandCoinsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family contributions could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ContributionsWorkspaceContent
      contributions={state.contributions}
      contributionsMessage={state.contributionsMessage}
      family={state.family}
      onPeriodChange={setPeriod}
      period={period}
    />
  );
}

function ContributionsWorkspaceContent({
  contributions,
  contributionsMessage,
  family,
  onPeriodChange,
  period,
}: {
  contributions: ContributionsOverview | null;
  contributionsMessage?: string;
  family: FamilyDetail;
  onPeriodChange: (period: ContributionPeriod) => void;
  period: ContributionPeriod;
}) {
  const currency = contributions?.currency ?? family.defaultCurrency;
  const hasSourceRecords = Boolean(
    contributions && (contributions.sourceRecordCount ?? 0) > 0,
  );
  const canManageContributions = hasCapability(family, "MANAGE_CONTRIBUTIONS");
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");
  const periodLabel = contributions?.period?.label ?? periodLabels[period];

  return (
    <div className="flex flex-col gap-6">
      <ContributionsHeader
        canExportReports={canExportReports}
        canManageContributions={canManageContributions}
        currency={currency}
        family={family}
        hasSourceRecords={hasSourceRecords}
      />
      <Separator />
      <ContributionsFilters
        onPeriodChange={onPeriodChange}
        period={period}
        periodLabel={periodLabel}
      />
      {contributionsMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved contribution records</AlertTitle>
          <AlertDescription>
            This screen is ready for contribution plans, cycles, per-member
            balances, payments, and verification work. Charts and totals stay
            empty until the backend returns persisted family contribution
            records. API detail: {contributionsMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      <ContributionsMetricCards
        contributions={contributions}
        currency={currency}
      />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="cycles">Cycles</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <ContributionsCharts
            contributions={contributions}
            currency={currency}
          />
          <ContributionsOperationsGrid
            contributions={contributions}
            family={family}
          />
        </TabsContent>
        <TabsContent value="plans">
          <ContributionsPlanTable
            contributions={contributions}
            currency={currency}
          />
        </TabsContent>
        <TabsContent value="members">
          <ContributionsMemberTable
            contributions={contributions}
            currency={currency}
          />
        </TabsContent>
        <TabsContent value="cycles">
          <ContributionsCycleList
            contributions={contributions}
            currency={currency}
          />
        </TabsContent>
        <TabsContent value="payments">
          <ContributionsPaymentTable
            contributions={contributions}
            currency={currency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContributionsHeader({
  canExportReports,
  canManageContributions,
  currency,
  family,
  hasSourceRecords,
}: {
  canExportReports: boolean;
  canManageContributions: boolean;
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
              Family contributions
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Manage every contribution that funds {family.name}: plans, cycles,
            per-member balances, payments, and verification. Totals, collection
            rates, and charts are shown only from persisted records returned by
            the API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button disabled={!canManageContributions} size="sm">
            <HandCoinsIcon aria-hidden="true" data-icon="inline-start" />
            Record contribution
          </Button>
          <Button
            disabled={!canManageContributions}
            size="sm"
            variant="outline"
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            New plan
          </Button>
          <Button disabled={!canExportReports} size="sm" variant="outline">
            <DownloadIcon aria-hidden="true" data-icon="inline-start" />
            Export
          </Button>
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

function ContributionsFilters({
  onPeriodChange,
  period,
  periodLabel,
}: {
  onPeriodChange: (period: ContributionPeriod) => void;
  period: ContributionPeriod;
  periodLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Contribution period</p>
          <p className="text-muted-foreground text-xs">
            Current view: {periodLabel}
          </p>
        </div>
      </div>
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as ContributionPeriod)}
      >
        <SelectTrigger
          className="w-full sm:w-44"
          aria-label="Contribution period"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="quarter">This quarter</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}

function ContributionsMetricCards({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const totals = contributions?.totals;
  const cards: {
    title: string;
    value: string;
    description: string;
    icon: typeof HandCoinsIcon;
  }[] = [
    {
      title: "Expected",
      value: formatOptionalMoney(totals?.expectedMinorUnits, currency),
      description: "Committed by approved plans this period",
      icon: CoinsIcon,
    },
    {
      title: "Collected",
      value: formatOptionalMoney(totals?.collectedMinorUnits, currency),
      description: "Verified contributions received",
      icon: HandCoinsIcon,
    },
    {
      title: "Outstanding",
      value: formatOptionalMoney(totals?.outstandingMinorUnits, currency),
      description: "Committed but not yet paid",
      icon: PiggyBankIcon,
    },
    {
      title: "Overdue",
      value: formatOptionalMoney(totals?.overdueMinorUnits, currency),
      description: "Past the cycle due date",
      icon: CalendarClockIcon,
    },
    {
      title: "Collection rate",
      value: formatOptionalPercent(totals?.collectionRatePercent),
      description: "Collected against expected",
      icon: PercentIcon,
    },
    {
      title: "Contributors",
      value: formatContributorRatio(
        totals?.contributorsPaid,
        totals?.contributorsExpected,
      ),
      description: "Members paid against expected",
      icon: UsersRoundIcon,
    },
  ];

  return (
    <section
      aria-label="Family contributions summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
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

function ContributionsCharts({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const trend = useMemo(
    () =>
      (contributions?.trend ?? []).map((point) => ({
        ...point,
        collectedMinorUnits: toChartNumber(point.collectedMinorUnits),
        expectedMinorUnits: toChartNumber(point.expectedMinorUnits),
      })),
    [contributions],
  );
  const statusBreakdown = useMemo(
    () =>
      (contributions?.statusBreakdown ?? []).map((point) => ({
        ...point,
        amountMinorUnits: toChartNumber(point.amountMinorUnits),
      })),
    [contributions],
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Collection trend</CardTitle>
          <CardDescription>
            Collected against expected by approved contribution cycle.
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
                            {name === "collectedMinorUnits"
                              ? "Collected"
                              : "Expected"}
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
                  dataKey="expectedMinorUnits"
                  type="monotone"
                  fill="var(--color-expectedMinorUnits)"
                  fillOpacity={0.12}
                  stroke="var(--color-expectedMinorUnits)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="collectedMinorUnits"
                  type="monotone"
                  fill="var(--color-collectedMinorUnits)"
                  fillOpacity={0.18}
                  stroke="var(--color-collectedMinorUnits)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={TrendingUpIcon}
              title="No collection trend"
              description="Approved contribution cycles will draw collected against expected here."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status breakdown</CardTitle>
          <CardDescription>
            How committed contributions are distributed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusBreakdown.length ? (
            <ChartContainer config={statusConfig} className="h-72 w-full">
              <BarChart
                accessibilityLayer
                data={statusBreakdown}
                layout="vertical"
              >
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
                  width={96}
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
              icon={ListChecksIcon}
              title="No status breakdown"
              description="Paid, pending, and overdue contribution amounts will appear here."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ContributionsOperationsGrid({
  contributions,
  family,
}: {
  contributions: ContributionsOverview | null;
  family: FamilyDetail;
}) {
  const totals = contributions?.totals;
  const items: {
    title: string;
    description: string;
    value: string;
    icon: typeof HandCoinsIcon;
    capability?: FamilyCapability;
  }[] = [
    {
      title: "Pending verifications",
      description: "Submitted payments waiting to be confirmed.",
      value:
        typeof totals?.pendingVerificationCount === "number"
          ? totals.pendingVerificationCount.toLocaleString()
          : "No queue",
      icon: FileClockIcon,
      capability: "MANAGE_CONTRIBUTIONS",
    },
    {
      title: "Overdue contributors",
      description: "Members past a cycle due date.",
      value:
        typeof totals?.overdueContributorCount === "number"
          ? totals.overdueContributorCount.toLocaleString()
          : "None",
      icon: AlertCircleIcon,
    },
    {
      title: "Active plans",
      description: "Contribution plans currently collecting.",
      value:
        typeof totals?.activePlanCount === "number"
          ? totals.activePlanCount.toLocaleString()
          : "0 plans",
      icon: BadgeCheckIcon,
      capability: "MANAGE_CONTRIBUTIONS",
    },
    {
      title: "Report source",
      description: "Reports must be generated from persisted records.",
      value: `${contributions?.sourceRecordCount ?? 0} records`,
      icon: CheckCircle2Icon,
      capability: "VIEW_REPORTS",
    },
  ];

  return (
    <section
      aria-label="Contribution operations"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items
        .filter(
          (item) => !item.capability || hasCapability(family, item.capability),
        )
        .map((item) => {
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

function ContributionsPlanTable({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const plans = contributions?.plans ?? [];
  const columns: ColumnDef<ContributionPlanRow>[] = [
    {
      accessorKey: "name",
      header: "Plan",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "cadence",
      header: "Cadence",
      cell: ({ row }) =>
        row.original.cadence ? formatTitle(row.original.cadence) : "Not set",
    },
    {
      accessorKey: "contributorCount",
      header: "Contributors",
      cell: ({ row }) =>
        typeof row.original.contributorCount === "number"
          ? row.original.contributorCount.toLocaleString()
          : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "active"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Per cycle</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.amountMinorUnits, currency)}
        </div>
      ),
    },
    {
      accessorKey: "collectedMinorUnits",
      header: () => <div className="text-right">Collected</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.collectedMinorUnits, currency)} /{" "}
          {formatOptionalMoney(row.original.expectedMinorUnits, currency)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution plans</CardTitle>
        <CardDescription>
          Approved plans that commit members to recurring contributions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {plans.length ? (
          <CommonDataTable columns={columns} data={plans} />
        ) : (
          <TableEmptyState
            icon={CoinsIcon}
            title="No contribution plans returned"
            description="Recurring contribution plans and their committed amounts will show here once saved."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ContributionsMemberTable({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const members = contributions?.members ?? [];
  const columns: ColumnDef<ContributionMemberRow>[] = [
    {
      accessorKey: "fullName",
      header: "Member",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.fullName}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "pending"} />
      ),
    },
    {
      accessorKey: "lastPaymentDate",
      header: "Last payment",
      cell: ({ row }) => formatDate(row.original.lastPaymentDate),
    },
    {
      accessorKey: "expectedMinorUnits",
      header: () => <div className="text-right">Expected</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.expectedMinorUnits, currency)}
        </div>
      ),
    },
    {
      accessorKey: "paidMinorUnits",
      header: () => <div className="text-right">Paid</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.paidMinorUnits, currency)}
        </div>
      ),
    },
    {
      accessorKey: "outstandingMinorUnits",
      header: () => <div className="text-right">Outstanding</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.outstandingMinorUnits, currency)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member balances</CardTitle>
        <CardDescription>
          Per-member contribution position for the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length ? (
          <CommonDataTable columns={columns} data={members} />
        ) : (
          <TableEmptyState
            icon={UsersRoundIcon}
            title="No member balances returned"
            description="Each member's expected, paid, and outstanding contribution amounts will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ContributionsCycleList({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const cycles = contributions?.cycles ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution cycles</CardTitle>
        <CardDescription>
          Collection progress per cycle, from approved source records.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {cycles.length ? (
          cycles.map((cycle) => (
            <div
              key={cycle.id ?? cycle.label}
              className="rounded-2xl border p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{cycle.label}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatOptionalMoney(cycle.collectedMinorUnits, currency)}{" "}
                    of {formatOptionalMoney(cycle.expectedMinorUnits, currency)}
                    {cycle.dueDate ? ` - due ${formatDate(cycle.dueDate)}` : ""}
                  </p>
                </div>
                <StatusBadge value={cycle.status ?? "collecting"} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(cycle.percentCollected)} />
                <p className="text-muted-foreground text-xs">
                  {typeof cycle.percentCollected === "number"
                    ? `${Math.round(cycle.percentCollected)}% collected`
                    : "Collection percent must come from the API."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <TableEmptyState
            icon={CalendarClockIcon}
            title="No contribution cycles returned"
            description="Approved cycles with their due dates and collection progress will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ContributionsPaymentTable({
  contributions,
  currency,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
}) {
  const payments = contributions?.payments ?? [];
  const columns: ColumnDef<ContributionPaymentRow>[] = [
    {
      accessorKey: "contributor",
      header: "Contributor",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.contributor}</span>
      ),
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => row.original.planName ?? "General",
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) =>
        row.original.method ? formatTitle(row.original.method) : "Unknown",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "recorded"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.amountMinorUnits, currency)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent payments</CardTitle>
        <CardDescription>
          The latest persisted contribution payments returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length ? (
          <CommonDataTable columns={columns} data={payments} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title="No recent payments returned"
            description="Verified contribution payments, their method, and status will show here."
          />
        )}
      </CardContent>
    </Card>
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
  icon: typeof HandCoinsIcon;
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
  icon: typeof HandCoinsIcon;
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

function FamilyContributionsSkeleton() {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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

function normalizeContributionsOverview(
  contributions?: ContributionsOverview,
): ContributionsOverview | null {
  if (!contributions) {
    return null;
  }

  return {
    ...contributions,
    trend: Array.isArray(contributions.trend) ? contributions.trend : [],
    statusBreakdown: Array.isArray(contributions.statusBreakdown)
      ? contributions.statusBreakdown
      : [],
    plans: Array.isArray(contributions.plans) ? contributions.plans : [],
    cycles: Array.isArray(contributions.cycles) ? contributions.cycles : [],
    members: Array.isArray(contributions.members) ? contributions.members : [],
    payments: Array.isArray(contributions.payments)
      ? contributions.payments
      : [],
  };
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

function formatOptionalPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "No records";
  }

  return `${Math.round(clampPercent(value))}%`;
}

function formatContributorRatio(
  paid: number | null | undefined,
  expected: number | null | undefined,
) {
  if (typeof paid !== "number" || typeof expected !== "number") {
    return "No records";
  }

  return `${paid.toLocaleString()} / ${expected.toLocaleString()}`;
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

function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
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
