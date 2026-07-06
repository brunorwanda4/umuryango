"use client";

import { AlertCircleIcon, ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { ApprovalAnalytics } from "./approvals/approval-analytics";
import { ApprovalDetailsSheet } from "./approvals/approval-details-sheet";
import { ApprovalFiltersPanel } from "./approvals/approval-filters-panel";
import { ApprovalQueue } from "./approvals/approval-queue";
import { ApprovalSummaryCards } from "./approvals/approval-summary-cards";
import type {
  ApprovalFilters,
  ApprovalQueueItem,
  MoneyTransaction,
} from "./approvals/types";
import {
  buildApprovalAnalytics,
  buildApprovalQueue,
  EMPTY_FILTERS,
  filterApprovals,
} from "./approvals/utils";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import type { MoneyOverview } from "./types";
import { normalizeMoneyOverview } from "./utils";

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
