"use client";

import { AlertCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import type { FamilyDetail } from "@/components/family/dashboard/types";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { createTranslator } from "@/i18n/translate";
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

const t = createTranslator("FamilyApprovals");

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
        throw new Error(
          familyResponse.message ??
            t((m) => m.FamilyApprovals.workspaceNotFound),
        );
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
              t((m) => m.FamilyApprovals.approvalSourceUnavailable)),
      );
      setTransactions(
        transactionResponse.ok && transactionResponse.data
          ? transactionResponse.data
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t((m) => m.FamilyApprovals.toastError),
      );
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

  const analytics = useMemo(
    () => buildApprovalAnalytics(visibleTransactions, visibleQueue),
    [visibleTransactions, visibleQueue],
  );

  const filteredQueue = useMemo(
    () => filterApprovals(visibleQueue, filters),
    [visibleQueue, filters],
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
      toast.error(t((m) => m.FamilyApprovals.toastDedicatedBackend));
      return;
    }

    if (!canApprove) {
      toast.error(t((m) => m.FamilyApprovals.toastNoPermission));
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
            ? t((m) => m.FamilyApprovals.toastApproved)
            : t((m) => m.FamilyApprovals.toastRejected),
        );
        await fetchData();
        setSelectedApproval(null);
      } else {
        toast.error(
          response.message ?? t((m) => m.FamilyApprovals.toastFailed),
        );
      }
    } catch {
      toast.error(t((m) => m.FamilyApprovals.toastError));
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
          <EmptyTitle>{t((m) => m.FamilyApprovals.loadErrorTitle)}</EmptyTitle>
          <EmptyDescription>
            {error || t((m) => m.FamilyApprovals.workspaceNotFound)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      <PageTitle
        title={t((m) => m.FamilyApprovals.pageTitle)}
        description={t((m) => m.FamilyApprovals.pageDesc)}
      />

      {moneyMessage ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircleIcon className="size-4 text-muted-foreground" />
              {t((m) => m.FamilyApprovals.approvalSourceUnavailable)}
            </CardTitle>
            <CardDescription>
              {t((m) => m.FamilyApprovals.approvalSourceUnavailableDesc, {
                message: moneyMessage,
              })}
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
