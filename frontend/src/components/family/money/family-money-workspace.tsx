"use client";

import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  DownloadIcon,
  FileClockIcon,
  FilterIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ListChecksIcon,
  PlusIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AUTHORITY_LABELS,
  type FamilyCapability,
  hasCapability,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

type MoneyPeriod = "month" | "quarter" | "year";

type MoneyMinorValue = number | string;

type MoneyOverview = {
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
    cashBalanceMinorUnits?: MoneyMinorValue | null;
    incomeMinorUnits?: MoneyMinorValue | null;
    expenseMinorUnits?: MoneyMinorValue | null;
    contributionsPaidMinorUnits?: MoneyMinorValue | null;
    savingsMinorUnits?: MoneyMinorValue | null;
    debtOutstandingMinorUnits?: MoneyMinorValue | null;
    pendingApprovalCount?: number | null;
    overdueCount?: number | null;
  };
  cashFlow?: MoneyCashFlowPoint[];
  allocation?: MoneyAllocationPoint[];
  budgets?: MoneyBudgetRow[];
  approvals?: MoneyApprovalRow[];
  records?: MoneyRecordRow[];
};

type MoneyCashFlowPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
};

type MoneyAllocationPoint = {
  label: string;
  amountMinorUnits?: MoneyMinorValue | null;
};

type MoneyBudgetRow = {
  id?: string;
  categoryName: string;
  spentMinorUnits?: MoneyMinorValue | null;
  limitMinorUnits?: MoneyMinorValue | null;
  percentUsed?: number | null;
  status?: string | null;
};

type MoneyApprovalRow = {
  id: string;
  type: string;
  title: string;
  amountMinorUnits?: MoneyMinorValue | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  status?: string | null;
};

type MoneyRecordRow = {
  id: string;
  type: string;
  title: string;
  category?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  date?: string | null;
  status?: string | null;
  createdBy?: string | null;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      money: MoneyOverview | null;
      moneyMessage?: string;
    };

const periodLabels: Record<MoneyPeriod, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

const cashFlowConfig = {
  incomeMinorUnits: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenseMinorUnits: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const allocationConfig = {
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

function MoneyHeader({
  canExportReports,
  canRecordExpense,
  canRecordIncome,
  currency,
  family,
  hasSourceRecords,
}: {
  canExportReports: boolean;
  canRecordExpense: boolean;
  canRecordIncome: boolean;
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
              Family money
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Manage {family.name} income, expenses, contributions, savings,
            debts, budgets, and approval work from one audited family workspace.
            Totals and charts are shown only from persisted records returned by
            the API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canRecordIncome ? (
            <Button
              disabled
              size="sm"
              title="Income recording needs the backend money write workflow."
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Record income
            </Button>
          ) : null}
          {canRecordExpense ? (
            <Button
              disabled
              size="sm"
              title="Expense recording needs the backend money write workflow."
              variant="outline"
            >
              <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
              Record expense
            </Button>
          ) : null}
          {canExportReports ? (
            <Button
              href={`/family/${encodeURIComponent(family.slug)}/reports`}
              size="sm"
              variant="outline"
            >
              <DownloadIcon aria-hidden="true" data-icon="inline-start" />
              Reports
            </Button>
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

function MoneyFilters({
  period,
  periodLabel,
  onPeriodChange,
}: {
  period: MoneyPeriod;
  periodLabel: string;
  onPeriodChange: (period: MoneyPeriod) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <FilterIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Money period</p>
          <p className="text-muted-foreground text-xs">
            Current view: {periodLabel}
          </p>
        </div>
      </div>
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as MoneyPeriod)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Money period">
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

function MoneyMetricCards({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = [
    {
      title: "Cash balance",
      value: totals?.cashBalanceMinorUnits,
      description: "Server-approved family position",
      icon: WalletCardsIcon,
    },
    {
      title: "Income",
      value: totals?.incomeMinorUnits,
      description: "Approved money received",
      icon: ArrowDownIcon,
    },
    {
      title: "Expenses",
      value: totals?.expenseMinorUnits,
      description: "Approved money spent",
      icon: ArrowUpIcon,
    },
    {
      title: "Contributions",
      value: totals?.contributionsPaidMinorUnits,
      description: "Paid family commitments",
      icon: HandCoinsIcon,
    },
    {
      title: "Savings",
      value: totals?.savingsMinorUnits,
      description: "Saved toward family goals",
      icon: TargetIcon,
    },
    {
      title: "Debts",
      value: totals?.debtOutstandingMinorUnits,
      description: "Outstanding borrowed or lent money",
      icon: LandmarkIcon,
    },
  ];

  return (
    <section
      aria-label="Family money summary"
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
                  {formatOptionalMoney(card.value, currency)}
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

function MoneyCharts({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const cashFlow = useMemo(
    () =>
      (money?.cashFlow ?? []).map((point) => ({
        ...point,
        incomeMinorUnits: toChartNumber(point.incomeMinorUnits),
        expenseMinorUnits: toChartNumber(point.expenseMinorUnits),
      })),
    [money],
  );
  const allocation = useMemo(
    () =>
      (money?.allocation ?? []).map((point) => ({
        ...point,
        amountMinorUnits: toChartNumber(point.amountMinorUnits),
      })),
    [money],
  );

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Cash flow</CardTitle>
          <CardDescription>
            Income and expenses by approved source records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cashFlow.length ? (
            <ChartContainer config={cashFlowConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={cashFlow}>
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
                            {name === "incomeMinorUnits"
                              ? "Income"
                              : "Expenses"}
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
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={CircleDollarSignIcon}
              title="No cash flow records"
              description="Approved income and expense records will draw this chart."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Money allocation</CardTitle>
          <CardDescription>
            Where family money is held or committed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocation.length ? (
            <ChartContainer config={allocationConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={allocation} layout="vertical">
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
              title="No allocation data"
              description="Savings, debts, contribution funds, and project budgets will appear here."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MoneyOperationsGrid({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const pendingApprovalCount = money?.totals?.pendingApprovalCount;
  const overdueCount = money?.totals?.overdueCount;
  const items: {
    title: string;
    description: string;
    value: string;
    icon: typeof WalletCardsIcon;
    capability?: FamilyCapability;
  }[] = [
    {
      title: "Pending approvals",
      description: "Expenses, income, and corrections waiting for review.",
      value:
        typeof pendingApprovalCount === "number"
          ? pendingApprovalCount.toLocaleString()
          : "No queue",
      icon: FileClockIcon,
      capability: "APPROVE_EXPENSE",
    },
    {
      title: "Overdue money work",
      description: "Debts, contributions, or budget reviews past due.",
      value:
        typeof overdueCount === "number"
          ? overdueCount.toLocaleString()
          : "None",
      icon: AlertCircleIcon,
    },
    {
      title: "Audit readiness",
      description: "Sensitive money changes require backend audit records.",
      value: money?.generatedAt ? "Traceable" : "Pending API",
      icon: ShieldCheckIcon,
    },
    {
      title: "Report source",
      description: "Reports must be generated from persisted records.",
      value: `${money?.sourceRecordCount ?? 0} records`,
      icon: CheckCircle2Icon,
      capability: "VIEW_REPORTS",
    },
  ];

  return (
    <section
      aria-label="Money operations"
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

function MoneyApprovalTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const approvals = money?.approvals ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval queue</CardTitle>
        <CardDescription>
          Reviewable money records returned by the family API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvals.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{formatTitle(row.type)}</TableCell>
                  <TableCell>{row.submittedBy ?? "Unknown"}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status ?? "pending"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(row.amountMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title="No approvals returned"
            description="Submitted income, expense, debt, and contribution records that need approval will show here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MoneyBudgetList({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const budgets = money?.budgets ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>
          Category limits compared with approved source records.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {budgets.length ? (
          budgets.map((budget) => (
            <div
              key={budget.id ?? budget.categoryName}
              className="rounded-2xl border p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{budget.categoryName}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatOptionalMoney(budget.spentMinorUnits, currency)} of{" "}
                    {formatOptionalMoney(budget.limitMinorUnits, currency)}
                  </p>
                </div>
                <StatusBadge value={budget.status ?? "tracking"} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(budget.percentUsed)} />
                <p className="text-muted-foreground text-xs">
                  {typeof budget.percentUsed === "number"
                    ? `${Math.round(budget.percentUsed)}% used`
                    : "Usage percent must come from the API."}
                </p>
              </div>
            </div>
          ))
        ) : (
          <TableEmptyState
            icon={ListChecksIcon}
            title="No budgets returned"
            description="Approved budget periods and category limits will appear here after they are saved."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MoneyRecordsTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = money?.records ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent records</CardTitle>
        <CardDescription>
          The latest persisted money records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{row.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatTitle(row.type)} by {row.createdBy ?? "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.category ?? "Uncategorized"}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status ?? "draft"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(row.amountMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title="No recent records returned"
            description="Income, expenses, contribution payments, savings movements, and debt repayments will show here."
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
  icon: typeof WalletCardsIcon;
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
  icon: typeof WalletCardsIcon;
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

function FamilyMoneySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
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

function normalizeMoneyOverview(money?: MoneyOverview): MoneyOverview | null {
  if (!money) {
    return null;
  }

  return {
    ...money,
    allocation: Array.isArray(money.allocation) ? money.allocation : [],
    approvals: Array.isArray(money.approvals) ? money.approvals : [],
    budgets: Array.isArray(money.budgets) ? money.budgets : [],
    cashFlow: Array.isArray(money.cashFlow) ? money.cashFlow : [],
    records: Array.isArray(money.records) ? money.records : [],
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
