"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Clock3Icon,
  DownloadIcon,
  EyeIcon,
  FileClockIcon,
  FileTextIcon,
  HistoryIcon,
  ListChecksIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ReceiptTextIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  UserRoundPlusIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import type { FamilyDetail } from "@/components/family/dashboard/types";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { TableEmptyState } from "./money-ui-helpers";
import type { MoneyApprovalRow, MoneyOverview } from "./types";
import {
  formatCompactMinorUnits,
  formatDate,
  formatMinorUnits,
  formatTitle,
  normalizeMoneyOverview,
  toChartNumber,
} from "./utils";

type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "DRAFT"
  | "REVERSED";

type ApprovalPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type ApprovalType =
  | "INCOME"
  | "EXPENSE"
  | "BUDGET"
  | "CONTRIBUTION"
  | "TRANSACTION"
  | "OTHER";

type MoneyTransaction = {
  id: string;
  familyId: string;
  categoryId: string;
  amountMinorUnits: string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";
  date: string;
  description: string | null;
  paymentMethod: string | null;
  notes: string | null;
  receivedFrom: string | null;
  receivedBy: string | null;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  reversedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { name: string };
  createdBy: { fullName: string };
  approvedBy?: { fullName: string } | null;
};

type ApprovalQueueItem = {
  id: string;
  source: "transaction" | "overview";
  type: ApprovalType;
  title: string;
  category: string;
  amountMinorUnits: string | null;
  requestedById: string | null;
  requestedBy: string;
  submittedAt: string | null;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  description: string;
  paymentMethod: string;
  receipt: string;
  budget: string;
  relatedProject: string;
  currentApprover: string;
  previousApprovers: string[];
  transaction?: MoneyTransaction;
};

type ApprovalFilters = {
  search: string;
  type: string;
  status: string;
  category: string;
  requestedBy: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  priority: string;
};

const EMPTY_FILTERS: ApprovalFilters = {
  search: "",
  type: "all",
  status: "all",
  category: "all",
  requestedBy: "all",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  priority: "all",
};

const approvalChartConfig = {
  pending: { label: "Pending", color: "var(--chart-3)" },
  approved: { label: "Approved", color: "var(--chart-4)" },
  rejected: { label: "Rejected", color: "var(--chart-2)" },
  averageHours: { label: "Average hours", color: "var(--chart-1)" },
  count: { label: "Approvals", color: "var(--chart-5)" },
} as const;

export function MoneyApprovalsPage({ familyName }: { familyName: string }) {
  const { user } = useCurrentUser();
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [money, setMoney] = useState<MoneyOverview | null>(null);
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [moneyMessage, setMoneyMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApprovalFilters>(EMPTY_FILTERS);
  const [selectedApproval, setSelectedApproval] =
    useState<ApprovalQueueItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMoneyMessage(null);

      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!familyResponse.ok || !familyResponse.data) {
        throw new Error(familyResponse.message ?? "Failed to load family.");
      }

      const familyData = familyResponse.data;
      setFamily(familyData);

      const [overviewResponse, transactionResponse] = await Promise.all([
        apiRequest<undefined, MoneyOverview>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/overview?period=month`,
        ),
        apiRequest<undefined, MoneyTransaction[]>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/transactions`,
        ),
      ]);

      setMoney(
        overviewResponse.ok
          ? normalizeMoneyOverview(overviewResponse.data)
          : null,
      );
      setMoneyMessage(
        overviewResponse.ok
          ? null
          : (overviewResponse.message ??
              "Money approval records are not available yet."),
      );
      setTransactions(
        transactionResponse.ok && transactionResponse.data
          ? transactionResponse.data
          : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [familyName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currency = money?.currency ?? family?.defaultCurrency ?? "RWF";
  const canApprove = family ? hasCapability(family, "APPROVE_EXPENSE") : false;
  const canAssign =
    family?.authority === "HEAD" || family?.authority === "ADMIN";

  const queue = useMemo(
    () => buildApprovalQueue(transactions, money?.approvals ?? []),
    [transactions, money],
  );

  const visibleQueue = useMemo(() => {
    if (canApprove) return queue;
    if (!user) return [];

    return queue.filter(
      (item) =>
        item.requestedById === user.id || item.requestedBy === user.fullName,
    );
  }, [canApprove, queue, user]);

  const visibleTransactions = useMemo(() => {
    if (canApprove) return transactions;
    if (!user) return [];

    return transactions.filter(
      (transaction) => transaction.createdById === user.id,
    );
  }, [canApprove, transactions, user]);

  const filteredQueue = useMemo(
    () => filterApprovals(visibleQueue, filters),
    [visibleQueue, filters],
  );

  const analytics = useMemo(
    () => buildApprovalAnalytics(visibleTransactions, visibleQueue),
    [visibleTransactions, visibleQueue],
  );

  const filterOptions = useMemo(() => {
    const categories = Array.from(
      new Set(visibleQueue.map((item) => item.category).filter(Boolean)),
    ).sort();
    const requesters = Array.from(
      new Set(visibleQueue.map((item) => item.requestedBy).filter(Boolean)),
    ).sort();

    return { categories, requesters };
  }, [visibleQueue]);

  const selectedVisibleApproval = useMemo(() => {
    if (!selectedApproval) return null;
    return (
      visibleQueue.find(
        (item) =>
          item.id === selectedApproval.id &&
          item.source === selectedApproval.source,
      ) ?? selectedApproval
    );
  }, [visibleQueue, selectedApproval]);

  const handleApprovalAction = async (
    approval: ApprovalQueueItem,
    action: "approve" | "reject",
  ) => {
    if (!family || approval.source !== "transaction") {
      toast.error("This approval type needs a dedicated backend workflow.");
      return;
    }

    if (!canApprove) {
      toast.error("You do not have permission to approve financial records.");
      return;
    }

    setProcessingId(approval.id);

    try {
      const response = await apiRequest(
        "post",
        `/families/${encodeURIComponent(
          family.id,
        )}/money/transactions/${encodeURIComponent(approval.id)}/${action}`,
      );

      if (response.ok) {
        toast.success(
          action === "approve"
            ? "Financial record approved."
            : "Financial record rejected.",
        );
        await fetchData();
        setSelectedApproval(null);
      } else {
        toast.error(response.message ?? "Approval action failed.");
      }
    } catch {
      toast.error("An error occurred during the approval action.");
    } finally {
      setProcessingId(null);
    }
  };

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  if (loading) return <FamilyMoneySkeleton />;

  if (error || !family) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Money approvals could not load</EmptyTitle>
          <EmptyDescription>
            {error || "Family workspace not found."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Financial review center</Badge>
              <Badge variant="secondary">{currency}</Badge>
              <Badge variant={canApprove ? "default" : "outline"}>
                {canApprove ? "Approver access" : "Limited access"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                <ShieldCheckIcon className="size-5 text-muted-foreground" />
              </span>
              <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
                Money Approvals
              </h1>
            </div>
            <p className="max-w-4xl text-muted-foreground text-sm leading-6">
              Review and approve financial transactions to keep family finances
              transparent, secure, and accountable.
            </p>
          </div>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money`}
            size="sm"
            variant="outline"
          >
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Money Overview
          </Button>
        </div>
        <nav
          aria-label="Money approval links"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/income`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Income
          </Button>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/expenses`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Expenses
          </Button>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/budgets`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Budgets
          </Button>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/receipts`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Receipts
          </Button>
        </nav>
      </header>

      <Separator />

      {moneyMessage ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircleIcon className="size-4 text-muted-foreground" />
              Approval source unavailable
            </CardTitle>
            <CardDescription>
              {moneyMessage} The page will show queue data as soon as the
              backend returns persisted approval records.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ApprovalSummaryCards analytics={analytics} currency={currency} />

      <ApprovalFiltersPanel
        categories={filterOptions.categories}
        filters={filters}
        requesters={filterOptions.requesters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      <ApprovalAnalytics
        analytics={analytics}
        currency={currency}
        hasRecords={visibleTransactions.length > 0 || visibleQueue.length > 0}
      />

      <ApprovalQueue
        approvals={filteredQueue}
        canApprove={canApprove}
        currency={currency}
        onAction={handleApprovalAction}
        onOpenDetails={setSelectedApproval}
        processingId={processingId}
      />

      <ApprovalDetailsSheet
        approval={selectedVisibleApproval}
        canApprove={canApprove}
        canAssign={canAssign}
        currency={currency}
        onAction={handleApprovalAction}
        onOpenChange={(open) => {
          if (!open) setSelectedApproval(null);
        }}
        processingId={processingId}
      />
    </div>
  );
}

function ApprovalSummaryCards({
  analytics,
  currency,
}: {
  analytics: ApprovalAnalyticsModel;
  currency: string;
}) {
  const cards = [
    {
      title: "Pending Approvals",
      value: analytics.pendingCount.toLocaleString(),
      helper: "Records waiting for review",
      icon: FileClockIcon,
    },
    {
      title: "Approved Today",
      value: analytics.approvedToday.toLocaleString(),
      helper: "Transactions locked today",
      icon: CheckCircle2Icon,
    },
    {
      title: "Rejected Today",
      value: analytics.rejectedToday.toLocaleString(),
      helper: "Rejected with audit history",
      icon: XCircleIcon,
    },
    {
      title: "Total Approved This Month",
      value: formatMinorUnits(analytics.approvedThisMonthMinorUnits, currency),
      helper: "Persisted approved transactions",
      icon: ShieldCheckIcon,
    },
    {
      title: "Average Approval Time",
      value: analytics.averageApprovalHours
        ? `${analytics.averageApprovalHours.toFixed(1)}h`
        : "No data",
      helper: "Created to approved timestamp",
      icon: Clock3Icon,
    },
    {
      title: "My Pending Reviews",
      value: analytics.myPendingReviews.toLocaleString(),
      helper: "Visible to this account",
      icon: ListChecksIcon,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader>
              <CardAction>
                <span className="flex size-9 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
              </CardAction>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="font-semibold text-2xl tracking-tight">
                {card.value}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{card.helper}</p>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}

function ApprovalFiltersPanel({
  categories,
  filters,
  requesters,
  onFiltersChange,
  onReset,
}: {
  categories: string[];
  filters: ApprovalFilters;
  requesters: string[];
  onFiltersChange: (filters: ApprovalFilters) => void;
  onReset: () => void;
}) {
  const updateFilter = (key: keyof ApprovalFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Narrow the queue by type, status, people, dates, amount, and priority.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search approvals"
            className="pl-9"
            placeholder="Search title, category, requester..."
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </div>
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(value) => updateFilter("type", value)}
          options={[
            ["all", "All types"],
            ["INCOME", "Income"],
            ["EXPENSE", "Expense"],
            ["BUDGET", "Budget"],
            ["CONTRIBUTION", "Contribution"],
            ["TRANSACTION", "Transaction"],
            ["OTHER", "Other"],
          ]}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={[
            ["all", "All statuses"],
            ["PENDING", "Pending"],
            ["APPROVED", "Approved"],
            ["REJECTED", "Rejected"],
            ["CHANGES_REQUESTED", "Changes requested"],
            ["DRAFT", "Draft"],
          ]}
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(value) => updateFilter("category", value)}
          options={[
            ["all", "All categories"],
            ...categories.map((category) => [category, category] as const),
          ]}
        />
        <FilterSelect
          label="Requested By"
          value={filters.requestedBy}
          onChange={(value) => updateFilter("requestedBy", value)}
          options={[
            ["all", "All requesters"],
            ...requesters.map((requester) => [requester, requester] as const),
          ]}
        />
        <Input
          aria-label="Start date"
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter("startDate", event.target.value)}
        />
        <Input
          aria-label="End date"
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter("endDate", event.target.value)}
        />
        <Input
          aria-label="Minimum amount"
          inputMode="numeric"
          placeholder="Min amount"
          value={filters.minAmount}
          onChange={(event) => updateFilter("minAmount", event.target.value)}
        />
        <Input
          aria-label="Maximum amount"
          inputMode="numeric"
          placeholder="Max amount"
          value={filters.maxAmount}
          onChange={(event) => updateFilter("maxAmount", event.target.value)}
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(value) => updateFilter("priority", value)}
          options={[
            ["all", "All priorities"],
            ["LOW", "Low"],
            ["NORMAL", "Normal"],
            ["HIGH", "High"],
            ["URGENT", "Urgent"],
          ]}
        />
        <Button
          className="sm:col-start-auto"
          type="button"
          variant="outline"
          onClick={onReset}
        >
          Reset filters
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [string, string])[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ApprovalAnalytics({
  analytics,
  currency,
  hasRecords,
}: {
  analytics: ApprovalAnalyticsModel;
  currency: string;
  hasRecords: boolean;
}) {
  if (!hasRecords) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval analytics</CardTitle>
          <CardDescription>
            Charts are generated from persisted approval and transaction
            records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TableEmptyState
            icon={BarChart3Icon}
            title="No approval analytics yet"
            description="Approval rate, category, monthly, rejection, and timing charts will appear once financial records are submitted and reviewed."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pending vs Approved</CardTitle>
          <CardDescription>
            Current pending queue compared with approved and rejected records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={analytics.statusComparison}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {analytics.statusComparison.map((entry) => (
                  <Cell fill={entry.fill} key={entry.label} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval rate</CardTitle>
          <CardDescription>
            Approved versus rejected transaction decisions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[14rem_1fr]">
          <ChartContainer config={approvalChartConfig} className="h-56 w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={analytics.approvalRate}
                dataKey="count"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
              >
                {analytics.approvalRate.map((entry) => (
                  <Cell fill={entry.fill} key={entry.label} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col justify-center gap-3">
            <p className="font-semibold text-3xl">
              {analytics.approvalPercent.toFixed(0)}%
            </p>
            <p className="text-muted-foreground text-sm leading-6">
              Approval rate is calculated only from persisted approved and
              rejected transactions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average approval time</CardTitle>
          <CardDescription>
            Monthly review speed from creation to approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <AreaChart accessibilityLayer data={analytics.approvalTimeByMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={42} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="averageHours"
                fill="var(--color-averageHours)"
                fillOpacity={0.18}
                stroke="var(--color-averageHours)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approvals by month</CardTitle>
          <CardDescription>
            Approved transaction volume by approval month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={analytics.approvalsByMonth}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approvals by category</CardTitle>
          <CardDescription>
            Approved transaction value grouped by category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              data={analytics.approvalsByCategory}
              layout="vertical"
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
                tickLine={false}
                axisLine={false}
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
                dataKey="amount"
                fill="var(--color-count)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rejections by category</CardTitle>
          <CardDescription>
            Rejected transaction count grouped by category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={approvalChartConfig} className="h-72 w-full">
            <BarChart
              accessibilityLayer
              data={analytics.rejectionsByCategory}
              layout="vertical"
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-rejected)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}

function ApprovalQueue({
  approvals,
  canApprove,
  currency,
  onAction,
  onOpenDetails,
  processingId,
}: {
  approvals: ApprovalQueueItem[];
  canApprove: boolean;
  currency: string;
  onAction: (approval: ApprovalQueueItem, action: "approve" | "reject") => void;
  onOpenDetails: (approval: ApprovalQueueItem) => void;
  processingId: string | null;
}) {
  const columns: ColumnDef<ApprovalQueueItem>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <button
          className="block max-w-[220px] truncate text-left font-medium hover:underline"
          type="button"
          onClick={() => onOpenDetails(row.original)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right font-mono">
          {row.original.amountMinorUnits
            ? formatMinorUnits(row.original.amountMinorUnits, currency)
            : "Not recorded"}
        </div>
      ),
    },
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.requestedBy}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.submittedAt)}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ApprovalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const approval = row.original;
        const canUseTransactionAction =
          canApprove &&
          approval.source === "transaction" &&
          approval.status === "PENDING";

        return (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Open approval details"
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={() => onOpenDetails(approval)}
            >
              <EyeIcon aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Approval actions"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreVerticalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenDetails(approval)}>
                  <FileTextIcon className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "approve")}
                >
                  <CheckCircle2Icon className="mr-2 size-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "reject")}
                >
                  <XCircleIcon className="mr-2 size-4" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MessageSquareIcon className="mr-2 size-4" />
                  Request Changes
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <UserRoundPlusIcon className="mr-2 size-4" />
                  Assign Approver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Approval Queue</CardTitle>
        <CardDescription>
          Pending income, expenses, budget requests, large transactions, and
          other financial records that require review.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {approvals.length ? (
          <CommonDataTable columns={columns} data={approvals} pageSize={8} />
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title="No pending approvals"
            description="All financial transactions have been reviewed. New income, expenses, or budget requests requiring approval will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalDetailsSheet({
  approval,
  canApprove,
  canAssign,
  currency,
  onAction,
  onOpenChange,
  processingId,
}: {
  approval: ApprovalQueueItem | null;
  canApprove: boolean;
  canAssign: boolean;
  currency: string;
  onAction: (approval: ApprovalQueueItem, action: "approve" | "reject") => void;
  onOpenChange: (open: boolean) => void;
  processingId: string | null;
}) {
  const isOpen = Boolean(approval);
  const canUseTransactionAction =
    Boolean(approval) &&
    canApprove &&
    approval?.source === "transaction" &&
    approval?.status === "PENDING";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl">
        {approval ? (
          <>
            <SheetHeader>
              <SheetTitle>{approval.title}</SheetTitle>
              <SheetDescription>
                Review the source record, financial context, people, comments,
                and approval history before taking action.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                <TypeBadge type={approval.type} />
                <ApprovalStatusBadge status={approval.status} />
                <PriorityBadge priority={approval.priority} />
              </div>

              <DetailSection title="General Information">
                <DetailRow
                  label="Transaction Type"
                  value={formatTitle(approval.type)}
                />
                <DetailRow label="Title" value={approval.title} />
                <DetailRow label="Category" value={approval.category} />
                <DetailRow
                  label="Amount"
                  value={
                    approval.amountMinorUnits
                      ? formatMinorUnits(approval.amountMinorUnits, currency)
                      : "Not recorded"
                  }
                  mono
                />
                <DetailRow
                  label="Date"
                  value={formatDate(
                    approval.transaction?.date ?? approval.submittedAt,
                  )}
                />
                <div className="rounded-md border p-3">
                  <p className="font-medium text-muted-foreground text-xs">
                    Description
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {approval.description}
                  </p>
                </div>
              </DetailSection>

              <DetailSection title="Financial Information">
                <DetailRow
                  label="Payment Method"
                  value={approval.paymentMethod}
                />
                <DetailRow label="Receipt" value={approval.receipt} />
                <DetailRow label="Budget" value={approval.budget} />
                <DetailRow
                  label="Related Project"
                  value={approval.relatedProject}
                />
              </DetailSection>

              <DetailSection title="People">
                <DetailRow label="Requested By" value={approval.requestedBy} />
                <DetailRow
                  label="Current Approver"
                  value={approval.currentApprover}
                />
                <DetailRow
                  label="Previous Approvers"
                  value={
                    approval.previousApprovers.length
                      ? approval.previousApprovers.join(", ")
                      : "None yet"
                  }
                />
              </DetailSection>

              <DetailSection title="Comments">
                <Textarea
                  disabled
                  placeholder="Approval comments need a backend approval-comments API before they can be saved."
                />
                <p className="text-muted-foreground text-xs leading-5">
                  Comments are prepared for timestamped persistence. Saving is
                  disabled until the backend exposes immutable approval
                  comments.
                </p>
              </DetailSection>

              <DetailSection title="Actions">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    disabled={
                      !canUseTransactionAction || processingId === approval.id
                    }
                    onClick={() => onAction(approval, "approve")}
                  >
                    <CheckCircle2Icon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Approve
                  </Button>
                  <Button
                    disabled={
                      !canUseTransactionAction || processingId === approval.id
                    }
                    variant="destructive"
                    onClick={() => onAction(approval, "reject")}
                  >
                    <XCircleIcon aria-hidden="true" data-icon="inline-start" />
                    Reject
                  </Button>
                  <Button disabled variant="outline">
                    <MessageSquareIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Request Changes
                  </Button>
                  <Button disabled variant="outline">
                    <ArrowLeftIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Return to Draft
                  </Button>
                  <Button disabled={!canAssign} variant="outline">
                    <UserRoundPlusIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    Assign Approver
                  </Button>
                  <Button disabled variant="outline">
                    <ReceiptTextIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    View Receipt
                  </Button>
                  <Button disabled variant="outline">
                    <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                    Download Attachment
                  </Button>
                </div>
              </DetailSection>

              <DetailSection title="Approval History">
                <ApprovalTimeline approval={approval} />
              </DetailSection>

              <DetailSection title="Notifications">
                <div className="grid gap-2">
                  {[
                    "Creator is notified when approved.",
                    "Creator is notified when rejected.",
                    "Creator is notified when changes are requested.",
                    "Next approver is notified when multi-level approval exists.",
                  ].map((notification) => (
                    <div
                      className="flex items-center gap-2 rounded-md border bg-muted/20 p-3 text-sm"
                      key={notification}
                    >
                      <SendIcon className="size-4 text-muted-foreground" />
                      {notification}
                    </div>
                  ))}
                </div>
              </DetailSection>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border p-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 border-b pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={mono ? "text-right font-mono" : "text-right"}>
        {value}
      </span>
    </div>
  );
}

function ApprovalTimeline({ approval }: { approval: ApprovalQueueItem }) {
  const items = buildApprovalTimeline(approval);

  return (
    <div className="relative flex flex-col gap-4">
      {items.map((item, index) => (
        <div
          className="relative flex gap-3"
          key={`${item.action}-${item.date}`}
        >
          <div className="flex flex-col items-center">
            <span className="mt-1 flex size-7 items-center justify-center rounded-full border bg-background">
              <HistoryIcon className="size-3.5 text-muted-foreground" />
            </span>
            {index < items.length - 1 ? (
              <span className="h-full min-h-8 w-px bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 pb-2">
            <p className="font-medium text-sm">{item.action}</p>
            <p className="text-muted-foreground text-xs">
              {item.user} - {formatDate(item.date)}
            </p>
            {item.comment ? (
              <p className="mt-1 rounded-md bg-muted/50 p-2 text-xs leading-5">
                {item.comment}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: ApprovalType }) {
  return <Badge variant="outline">{formatTitle(type)}</Badge>;
}

function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const variant =
    status === "APPROVED"
      ? "default"
      : status === "REJECTED"
        ? "destructive"
        : status === "PENDING"
          ? "secondary"
          : "outline";

  return <Badge variant={variant}>{formatTitle(status)}</Badge>;
}

function PriorityBadge({ priority }: { priority: ApprovalPriority }) {
  const variant =
    priority === "URGENT" || priority === "HIGH" ? "destructive" : "outline";

  return <Badge variant={variant}>{formatTitle(priority)}</Badge>;
}

type ApprovalAnalyticsModel = {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  approvedThisMonthMinorUnits: string;
  averageApprovalHours: number | null;
  myPendingReviews: number;
  approvalPercent: number;
  statusComparison: { label: string; count: number; fill: string }[];
  approvalRate: { label: string; count: number; fill: string }[];
  approvalsByMonth: { label: string; count: number }[];
  approvalTimeByMonth: { label: string; averageHours: number }[];
  approvalsByCategory: { label: string; amount: number }[];
  rejectionsByCategory: { label: string; count: number }[];
};

function buildApprovalQueue(
  transactions: MoneyTransaction[],
  overviewApprovals: MoneyApprovalRow[],
): ApprovalQueueItem[] {
  const pendingTransactions = transactions
    .filter((transaction) => transaction.status === "PENDING")
    .map(transactionToApproval);
  const transactionIds = new Set(pendingTransactions.map((item) => item.id));
  const overviewOnlyApprovals = overviewApprovals
    .filter((approval) => !transactionIds.has(approval.id))
    .map(overviewRowToApproval);

  return [...pendingTransactions, ...overviewOnlyApprovals].sort(
    (first, second) => getTime(second.submittedAt) - getTime(first.submittedAt),
  );
}

function transactionToApproval(
  transaction: MoneyTransaction,
): ApprovalQueueItem {
  return {
    id: transaction.id,
    source: "transaction",
    type: transaction.type,
    title:
      transaction.description || `${formatTitle(transaction.type)} Transaction`,
    category: transaction.category?.name ?? "Uncategorized",
    amountMinorUnits: transaction.amountMinorUnits,
    requestedById: transaction.createdById,
    requestedBy: transaction.createdBy?.fullName ?? "Unknown member",
    submittedAt: transaction.createdAt,
    priority: inferPriority(
      transaction.amountMinorUnits,
      transaction.createdAt,
    ),
    status: transaction.status,
    description:
      transaction.notes ||
      transaction.description ||
      "No additional description was recorded.",
    paymentMethod: transaction.paymentMethod
      ? formatTitle(transaction.paymentMethod)
      : "Not recorded",
    receipt: "Not attached",
    budget: "Not linked",
    relatedProject: "Not linked",
    currentApprover: "Finance approver",
    previousApprovers: transaction.approvedBy?.fullName
      ? [transaction.approvedBy.fullName]
      : [],
    transaction,
  };
}

function overviewRowToApproval(row: MoneyApprovalRow): ApprovalQueueItem {
  const normalizedType = normalizeApprovalType(row.type);

  return {
    id: row.id,
    source: "overview",
    type: normalizedType,
    title: row.title,
    category: normalizedType === "CONTRIBUTION" ? "Contribution" : "General",
    amountMinorUnits: row.amountMinorUnits?.toString() ?? null,
    requestedById: null,
    requestedBy: row.submittedBy ?? "Unknown member",
    submittedAt: row.submittedAt ?? null,
    priority: inferPriority(row.amountMinorUnits, row.submittedAt),
    status: normalizeStatus(row.status),
    description:
      "This approval is listed by the money overview. Open the source module for full supporting details.",
    paymentMethod: "Not recorded",
    receipt: "Not attached",
    budget: "Not linked",
    relatedProject: "Not linked",
    currentApprover: "Finance approver",
    previousApprovers: [],
  };
}

function filterApprovals(
  approvals: ApprovalQueueItem[],
  filters: ApprovalFilters,
) {
  const min = filters.minAmount
    ? Number(filters.minAmount.replace(/,/g, ""))
    : null;
  const max = filters.maxAmount
    ? Number(filters.maxAmount.replace(/,/g, ""))
    : null;

  return approvals.filter((approval) => {
    const searchText = [
      approval.title,
      approval.category,
      approval.requestedBy,
      approval.description,
      approval.type,
      approval.status,
    ]
      .join(" ")
      .toLowerCase();
    const amount = toChartNumber(approval.amountMinorUnits);
    const submittedTime = getTime(approval.submittedAt);
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
    if (endDate) endDate.setDate(endDate.getDate() + 1);

    return (
      (!filters.search ||
        searchText.includes(filters.search.trim().toLowerCase())) &&
      (filters.type === "all" || approval.type === filters.type) &&
      (filters.status === "all" || approval.status === filters.status) &&
      (filters.category === "all" || approval.category === filters.category) &&
      (filters.requestedBy === "all" ||
        approval.requestedBy === filters.requestedBy) &&
      (!filters.priority ||
        filters.priority === "all" ||
        approval.priority === filters.priority) &&
      (!filters.startDate ||
        submittedTime >= new Date(filters.startDate).getTime()) &&
      (!endDate || submittedTime < endDate.getTime()) &&
      (min === null || Number.isNaN(min) || amount >= min) &&
      (max === null || Number.isNaN(max) || amount <= max)
    );
  });
}

function buildApprovalAnalytics(
  transactions: MoneyTransaction[],
  queue: ApprovalQueueItem[],
): ApprovalAnalyticsModel {
  const now = new Date();
  const todayKey = toDateKey(now);
  const monthKey = toMonthKey(now);
  const approvedTransactions = transactions.filter(
    (transaction) => transaction.status === "APPROVED",
  );
  const rejectedTransactions = transactions.filter(
    (transaction) => transaction.status === "REJECTED",
  );
  const approvedToday = approvedTransactions.filter(
    (transaction) => toDateKey(transaction.approvedAt) === todayKey,
  ).length;
  const rejectedToday = rejectedTransactions.filter(
    (transaction) => toDateKey(transaction.updatedAt) === todayKey,
  ).length;
  const approvedThisMonthMinorUnits = approvedTransactions
    .filter((transaction) => toMonthKey(transaction.approvedAt) === monthKey)
    .reduce(
      (sum, transaction) => sum + BigInt(transaction.amountMinorUnits || "0"),
      BigInt(0),
    )
    .toString();
  const approvalDurations = approvedTransactions
    .map((transaction) => {
      if (!transaction.approvedAt) return null;

      const duration =
        (new Date(transaction.approvedAt).getTime() -
          new Date(transaction.createdAt).getTime()) /
        3_600_000;

      return Number.isFinite(duration) && duration >= 0 ? duration : null;
    })
    .filter((value): value is number => value !== null);
  const averageApprovalHours = approvalDurations.length
    ? approvalDurations.reduce((sum, value) => sum + value, 0) /
      approvalDurations.length
    : null;
  const decisionCount =
    approvedTransactions.length + rejectedTransactions.length;
  const approvalPercent = decisionCount
    ? (approvedTransactions.length / decisionCount) * 100
    : 0;

  return {
    pendingCount: queue.length,
    approvedToday,
    rejectedToday,
    approvedThisMonthMinorUnits,
    averageApprovalHours,
    myPendingReviews: queue.length,
    approvalPercent,
    statusComparison: [
      { label: "Pending", count: queue.length, fill: "var(--chart-3)" },
      {
        label: "Approved",
        count: approvedTransactions.length,
        fill: "var(--chart-4)",
      },
      {
        label: "Rejected",
        count: rejectedTransactions.length,
        fill: "var(--chart-2)",
      },
    ],
    approvalRate: [
      {
        label: "Approved",
        count: approvedTransactions.length,
        fill: "var(--chart-4)",
      },
      {
        label: "Rejected",
        count: rejectedTransactions.length,
        fill: "var(--chart-2)",
      },
    ],
    approvalsByMonth: groupCountByMonth(
      approvedTransactions,
      (transaction) => transaction.approvedAt,
    ),
    approvalTimeByMonth: groupAverageApprovalTimeByMonth(approvedTransactions),
    approvalsByCategory: groupApprovedAmountByCategory(approvedTransactions),
    rejectionsByCategory: groupRejectedCountByCategory(rejectedTransactions),
  };
}

function buildApprovalTimeline(approval: ApprovalQueueItem) {
  const items = [
    {
      user: approval.requestedBy,
      action: "Created",
      date: approval.transaction?.createdAt ?? approval.submittedAt,
      comment: "Financial record created for family review.",
    },
    {
      user: approval.requestedBy,
      action: "Submitted",
      date: approval.submittedAt,
      comment: "Submitted to the approval queue.",
    },
  ];

  if (approval.transaction?.updatedAt) {
    items.push({
      user: "Family audit",
      action: "Reviewed",
      date: approval.transaction.updatedAt,
      comment: "Latest persisted review state.",
    });
  }

  if (approval.status === "APPROVED" && approval.transaction?.approvedAt) {
    items.push({
      user: approval.transaction.approvedBy?.fullName ?? "Approver",
      action: "Approved",
      date: approval.transaction.approvedAt,
      comment: "Record approved and locked for reporting.",
    });
  }

  if (approval.status === "REJECTED") {
    items.push({
      user: "Approver",
      action: "Rejected",
      date: approval.transaction?.updatedAt ?? approval.submittedAt,
      comment: "Rejected records remain visible with audit history.",
    });
  }

  return items.filter((item) => item.date);
}

function normalizeApprovalType(value: string): ApprovalType {
  const normalized = value.toUpperCase();
  if (normalized.includes("INCOME")) return "INCOME";
  if (normalized.includes("EXPENSE")) return "EXPENSE";
  if (normalized.includes("BUDGET")) return "BUDGET";
  if (normalized.includes("CONTRIBUTION")) return "CONTRIBUTION";
  if (normalized.includes("TRANSACTION")) return "TRANSACTION";

  return "OTHER";
}

function normalizeStatus(value: string | null | undefined): ApprovalStatus {
  const normalized = value?.toUpperCase();
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CHANGES_REQUESTED") return "CHANGES_REQUESTED";
  if (normalized === "DRAFT") return "DRAFT";
  if (normalized === "REVERSED") return "REVERSED";

  return "PENDING";
}

function inferPriority(
  amountMinorUnits: unknown,
  submittedAt: string | null | undefined,
): ApprovalPriority {
  const amount = toChartNumber(amountMinorUnits);
  const ageHours =
    submittedAt && getTime(submittedAt)
      ? (Date.now() - getTime(submittedAt)) / 3_600_000
      : 0;

  if (ageHours >= 72 || amount >= 5_000_000) return "URGENT";
  if (ageHours >= 24 || amount >= 1_000_000) return "HIGH";
  if (amount <= 50_000) return "LOW";

  return "NORMAL";
}

function groupCountByMonth<T>(
  records: T[],
  getDate: (record: T) => string | null,
) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const date = getDate(record);
    if (!date) continue;

    const key = toMonthKey(date);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return mapMonthEntries(grouped, "count");
}

function groupAverageApprovalTimeByMonth(records: MoneyTransaction[]) {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const record of records) {
    if (!record.approvedAt) continue;

    const key = toMonthKey(record.approvedAt);
    const duration =
      (new Date(record.approvedAt).getTime() -
        new Date(record.createdAt).getTime()) /
      3_600_000;

    if (!Number.isFinite(duration) || duration < 0) continue;

    const current = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, {
      total: current.total + duration,
      count: current.count + 1,
    });
  }

  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => ({
      label: formatMonthKey(key),
      averageHours: value.count
        ? Number((value.total / value.count).toFixed(2))
        : 0,
    }));
}

function groupApprovedAmountByCategory(records: MoneyTransaction[]) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const category = record.category?.name ?? "Uncategorized";
    grouped.set(
      category,
      (grouped.get(category) ?? 0) + toChartNumber(record.amountMinorUnits),
    );
  }

  return Array.from(grouped.entries())
    .sort(([, first], [, second]) => second - first)
    .slice(0, 8)
    .map(([label, amount]) => ({ label, amount }));
}

function groupRejectedCountByCategory(records: MoneyTransaction[]) {
  const grouped = new Map<string, number>();

  for (const record of records) {
    const category = record.category?.name ?? "Uncategorized";
    grouped.set(category, (grouped.get(category) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .sort(([, first], [, second]) => second - first)
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
}

function mapMonthEntries(grouped: Map<string, number>, valueKey: "count") {
  return Array.from(grouped.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => ({
      label: formatMonthKey(key),
      [valueKey]: value,
    })) as { label: string; count: number }[];
}

function toDateKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function toMonthKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 7);
}

function formatMonthKey(value: string) {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function getTime(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
