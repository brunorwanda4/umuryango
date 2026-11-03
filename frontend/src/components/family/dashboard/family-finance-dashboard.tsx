"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  PiggyBankIcon,
  PlusIcon,
  ReceiptTextIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "@/components/common/dashboard/dashboard-balance-card";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardStatTile } from "@/components/common/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  getLoanProgress,
  isLoanOverdue,
} from "@/components/family/money/loans/loan-utils";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import type { MoneyOverview } from "@/components/family/money/types";
import {
  formatDate,
  formatFullMinorUnits,
  formatMinorUnits,
  formatTitle,
  normalizeMoneyOverview,
  toChartNumber,
} from "@/components/family/money/utils";
import type { ProjectsOverview } from "@/components/family/projects/types";
import {
  clampPercent,
  createProjectSlug,
} from "@/components/family/projects/utils";
import type { MoneyFormCategory } from "@/components/money/money-form-dialog";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";
import {
  buildAttentionItems,
  summarizeFamilyLoans,
  toBigIntMinorUnits,
} from "./dashboard-data";
import type {
  ContributionsOverview,
  FamilyAttentionItem,
  FamilyDetail,
  FamilyMemberSummary,
  RejectedTransactionRow,
} from "./types";

const t = createTranslator("FamilyDashboard");

export function FamilyFinancialSummary({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const router = useRouter();
  const normalizedMoney = normalizeMoneyOverview(money ?? undefined);
  const currency = normalizedMoney?.currency ?? family.defaultCurrency;
  const totals = normalizedMoney?.totals;
  const moneyAvailable = normalizedMoney !== null;
  const encodedSlug = encodeURIComponent(family.slug);
  const moneyHref = `/family/${encodedSlug}/money`;
  const canRecordIncome = hasCapability(family, "RECORD_INCOME");
  const canRecordExpense = hasCapability(family, "RECORD_EXPENSE");
  const [categories, setCategories] = useState<MoneyFormCategory[]>([]);

  const loadCategories = useCallback(async () => {
    if (!canRecordIncome && !canRecordExpense) return;

    const response = await apiRequest<undefined, MoneyFormCategory[]>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/categories`,
    );
    if (response.ok && response.data) setCategories(response.data);
  }, [canRecordExpense, canRecordIncome, family.id]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const refreshDashboard = () => router.refresh();

  return (
    <section
      aria-label={t((m) => m.FamilyDashboard.overviewAriaLabel)}
      className="w-full"
    >
      <DashboardBalanceCard
        className="w-full"
        label={t((m) => m.FamilyDashboard.totalBalance, { currency })}
        currency={currency}
        value={totals?.cashBalanceMinorUnits ?? 0}
        href={moneyHref}
        unavailable={!moneyAvailable}
        unavailableLabel={t((m) => m.FamilyDashboard.moneyUnavailable)}
      >
        <DashboardBalanceStat
          href={`${moneyHref}/income`}
          currency={currency}
          label={t((m) => m.FamilyDashboard.incomeThisMonth)}
          value={totals?.incomeMinorUnits ?? 0}
          variant="income"
          action={
            canRecordIncome ? (
              <MoneyFormDialog
                categories={categories}
                currency={currency}
                familyId={family.id}
                onCategoryCreated={loadCategories}
                onSuccess={refreshDashboard}
                scope="family"
                type="income"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t((m) => m.FamilyDashboard.addIncome)}
                    className="rounded-full"
                  >
                    <PlusIcon data-icon="inline-start" aria-hidden="true" />
                  </Button>
                }
              />
            ) : null
          }
        />
        <DashboardBalanceStat
          href={`${moneyHref}/expenses`}
          currency={currency}
          label={t((m) => m.FamilyDashboard.spentThisMonth)}
          value={totals?.expenseMinorUnits ?? 0}
          variant="expense"
          action={
            canRecordExpense ? (
              <MoneyFormDialog
                categories={categories}
                currency={currency}
                familyId={family.id}
                onCategoryCreated={loadCategories}
                onSuccess={refreshDashboard}
                scope="family"
                type="expense"
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t((m) => m.FamilyDashboard.addExpense)}
                    className="rounded-full"
                  >
                    <PlusIcon data-icon="inline-start" aria-hidden="true" />
                  </Button>
                }
              />
            ) : null
          }
        />
      </DashboardBalanceCard>
    </section>
  );
}

export function FamilyMoneyOverviewCard({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const normalizedMoney = normalizeMoneyOverview(money ?? undefined);
  const encodedSlug = encodeURIComponent(family.slug);
  const moneyHref = `/family/${encodedSlug}/money`;
  const currency = normalizedMoney?.currency ?? family.defaultCurrency;

  const chartConfig = useMemo(
    () =>
      ({
        amount: {
          label: t((m) => m.FamilyDashboard.amount),
          color: "var(--chart-1)",
        },
      }) satisfies ChartConfig,
    [],
  );

  if (!normalizedMoney) {
    return (
      <DashboardSectionCard
        title={t((m) => m.FamilyDashboard.moneyOverviewTitle)}
        description={t((m) => m.FamilyDashboard.moneyOverviewDesc)}
        actionHref={moneyHref}
        actionLabel={t((m) => m.FamilyDashboard.openMoney)}
      >
        <DashboardEmptyState
          className="min-h-64"
          icon={<ReceiptTextIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.moneyUnavailableTitle)}
          description={t((m) => m.FamilyDashboard.moneyUnavailableDesc)}
        />
      </DashboardSectionCard>
    );
  }

  const income = normalizedMoney.totals?.incomeMinorUnits ?? "0";
  const expenses = normalizedMoney.totals?.expenseMinorUnits ?? "0";
  const records = (normalizedMoney.records ?? []).slice(0, 4);
  const hasMoneyActivity =
    toBigIntMinorUnits(income) > 0n ||
    toBigIntMinorUnits(expenses) > 0n ||
    (normalizedMoney.sourceRecordCount ?? 0) > 0 ||
    records.length > 0;

  const chartData = [
    {
      name: t((m) => m.FamilyDashboard.income),
      amount: toChartNumber(income),
      fill: "var(--chart-2)",
    },
    {
      name: t((m) => m.FamilyDashboard.expenses),
      amount: toChartNumber(expenses),
      fill: "var(--chart-1)",
    },
  ];

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.moneyOverviewTitle)}
      description={t((m) => m.FamilyDashboard.moneyOverviewDesc)}
      actionHref={moneyHref}
      actionLabel={t((m) => m.FamilyDashboard.openMoney)}
    >
      {!hasMoneyActivity ? (
        <DashboardEmptyState
          className="min-h-64"
          icon={<ReceiptTextIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noMoneyRecordsTitle)}
          description={t((m) => m.FamilyDashboard.noMoneyRecordsDesc)}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <ChartContainer
              config={chartConfig}
              className="h-36 w-full aspect-auto"
              initialDimension={{ height: 144, width: 560 }}
            >
              <BarChart
                data={chartData}
                margin={{ left: 0, right: 8, top: 8 }}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatFullMinorUnits(value, currency)
                          : value
                      }
                    />
                  }
                />
                <Bar dataKey="amount" radius={8} />
              </BarChart>
            </ChartContainer>
          </div>

          <Separator className="bg-border/60" />

          <div className="flex flex-col gap-2.5">
            <p className="font-semibold text-xs text-foreground">
              {t((m) => m.FamilyDashboard.recentTransactionsTitle)}
            </p>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {t((m) => m.FamilyDashboard.noRecentTransactions)}
              </p>
            ) : (
              <ItemGroup className="gap-2">
                {records.map((record) => {
                  const statusUpper = (record.status ?? "").toUpperCase();
                  const isIncome = record.type === "INCOME";

                  return (
                    <Item
                      key={record.id}
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-nowrap bg-muted/20 hover:bg-muted/40"
                    >
                      <Link href={moneyHref}>
                        <ItemMedia
                          variant="icon"
                          className={cn(
                            "size-8 rounded-lg",
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {isIncome ? (
                            <ArrowDownLeftIcon aria-hidden="true" />
                          ) : (
                            <ArrowUpRightIcon aria-hidden="true" />
                          )}
                        </ItemMedia>

                        <ItemContent className="min-w-0">
                          <ItemTitle className="w-full min-w-0 line-clamp-none">
                            <span className="truncate text-xs">
                              {record.title}
                            </span>
                            {record.status ? (
                              <Badge
                                variant={
                                  statusUpper === "REJECTED"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="h-4 shrink-0 px-1.5 py-0 text-[10px]"
                              >
                                {statusUpper === "APPROVED"
                                  ? t(
                                      (m) =>
                                        m.FamilyDashboard.transactionStatus
                                          .APPROVED,
                                    )
                                  : statusUpper === "PENDING"
                                    ? t(
                                        (m) =>
                                          m.FamilyDashboard.transactionStatus
                                            .PENDING,
                                      )
                                    : statusUpper === "REJECTED"
                                      ? t(
                                          (m) =>
                                            m.FamilyDashboard.transactionStatus
                                              .REJECTED,
                                        )
                                      : formatTitle(record.status)}
                              </Badge>
                            ) : null}
                          </ItemTitle>
                          <ItemDescription className="line-clamp-none text-[11px]">
                            <span className="block truncate">
                              {record.category ?? formatTitle(record.type)}
                            </span>
                            <span className="block truncate">
                              {record.createdBy
                                ? `${t((m) => m.FamilyDashboard.submittedBy, { name: record.createdBy })} · `
                                : ""}
                              {t((m) => m.FamilyDashboard.recordedOnLabel, {
                                date: formatDate(record.date),
                              })}
                            </span>
                          </ItemDescription>
                        </ItemContent>

                        <ItemActions className="ml-auto shrink-0">
                          <CompactMoney
                            className={cn(
                              "block font-mono text-xs font-bold tabular-nums",
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400",
                            )}
                            currency={currency}
                            value={record.amountMinorUnits ?? 0}
                          />
                        </ItemActions>
                      </Link>
                    </Item>
                  );
                })}
              </ItemGroup>
            )}
          </div>
        </>
      )}
    </DashboardSectionCard>
  );
}

function getAttentionBadgeLabel(kind: FamilyAttentionItem["kind"]) {
  switch (kind) {
    case "pending-approval":
      return t((m) => m.FamilyDashboard.pendingApprovalBadge);
    case "overdue-record":
      return t((m) => m.FamilyDashboard.overdueBadge);
    case "rejected-record":
      return t((m) => m.FamilyDashboard.rejectedBadge);
    case "awaiting-verification":
      return t((m) => m.FamilyDashboard.awaitingVerificationBadge);
  }
}

export function FamilyAttentionCard({
  family,
  currentMember,
  money,
  contributions,
  rejectedTransactions,
}: {
  family: FamilyDetail;
  currentMember: FamilyMemberSummary | null;
  money: MoneyOverview | null;
  contributions: ContributionsOverview | null;
  rejectedTransactions: RejectedTransactionRow[] | null;
}) {
  const canApproveExpense = hasCapability(family, "APPROVE_EXPENSE");
  const encodedSlug = encodeURIComponent(family.slug);
  const actionHref = canApproveExpense
    ? `/family/${encodedSlug}/money/approvals`
    : undefined;

  if (money === null && contributions === null) {
    return (
      <DashboardSectionCard
        title={t((m) => m.FamilyDashboard.moneyToReviewTitle)}
        description={
          canApproveExpense
            ? t((m) => m.FamilyDashboard.moneyToReviewDesc)
            : t((m) => m.FamilyDashboard.moneyToReviewMemberDesc)
        }
        actionHref={actionHref}
        actionLabel={
          actionHref ? t((m) => m.FamilyDashboard.openApprovals) : undefined
        }
      >
        <DashboardEmptyState
          icon={<CalendarCheckIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.attentionUnavailableTitle)}
          description={t((m) => m.FamilyDashboard.attentionUnavailableDesc)}
        />
      </DashboardSectionCard>
    );
  }

  const items = buildAttentionItems({
    family,
    currentMember,
    money,
    contributions,
    rejectedTransactions,
  });

  const pendingApprovalsCount = canApproveExpense
    ? (money?.totals?.pendingApprovalCount ?? 0)
    : items.filter((item) => item.kind === "pending-approval").length;
  const overdueCount = canApproveExpense
    ? (money?.totals?.overdueCount ?? 0)
    : items.filter((item) => item.kind === "overdue-record").length;
  const verificationCount =
    contributions?.totals?.pendingVerificationCount ??
    items.filter((item) => item.kind === "awaiting-verification").length;

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.moneyToReviewTitle)}
      description={
        canApproveExpense
          ? t((m) => m.FamilyDashboard.moneyToReviewDesc)
          : t((m) => m.FamilyDashboard.moneyToReviewMemberDesc)
      }
      actionHref={actionHref}
      actionLabel={
        actionHref ? t((m) => m.FamilyDashboard.openApprovals) : undefined
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.pendingApprovals)}
          valueClassName={
            pendingApprovalsCount > 0
              ? "text-amber-600 dark:text-amber-400"
              : undefined
          }
          value={money === null ? "—" : pendingApprovalsCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.overdue)}
          valueClassName={overdueCount > 0 ? "text-destructive" : undefined}
          value={money === null ? "—" : overdueCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.pendingReview)}
          valueClassName={
            verificationCount > 0
              ? "text-blue-600 dark:text-blue-400"
              : undefined
          }
          value={contributions === null ? "—" : verificationCount}
        />
      </div>

      {items.length === 0 ? (
        <DashboardEmptyState
          icon={<CalendarCheckIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.nothingNeedsAttentionTitle)}
          description={t((m) => m.FamilyDashboard.nothingNeedsAttentionDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 transition-colors hover:bg-muted/40 block"
              >
                <AttentionItemRow item={item} />
              </Link>
            ) : (
              <div
                key={item.id}
                className="rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3"
              >
                <AttentionItemRow item={item} />
              </div>
            ),
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}

function AttentionItemRow({ item }: { item: FamilyAttentionItem }) {
  const isDestructive =
    item.kind === "overdue-record" || item.kind === "rejected-record";
  const isWarning = item.kind === "pending-approval";

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-semibold text-foreground">{item.title}</p>
          <Badge
            variant={
              isDestructive ? "destructive" : isWarning ? "outline" : "outline"
            }
            className={cn(
              "text-[10px] px-1.5 py-0 h-4",
              isWarning &&
                "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
            )}
          >
            {getAttentionBadgeLabel(item.kind)}
          </Badge>
        </div>
        <p className="truncate text-muted-foreground text-[10px] mt-0.5">
          {item.subtitle}
          {item.date ? ` · ${formatDate(item.date)}` : ""}
        </p>
      </div>
      <CompactMoney
        className="shrink-0 font-mono font-bold tabular-nums text-foreground"
        currency={item.currency}
        value={item.amountMinorUnits}
      />
    </div>
  );
}

export function FamilyContributionsOverviewCard({
  family,
  contributions,
}: {
  family: FamilyDetail;
  contributions: ContributionsOverview | null;
}) {
  const currency = contributions?.currency ?? family.defaultCurrency;

  if (!contributions) {
    return (
      <DashboardSectionCard
        title={t((m) => m.FamilyDashboard.contributionsTitle)}
        description={t((m) => m.FamilyDashboard.contributionsDesc)}
      >
        <DashboardEmptyState
          icon={<PiggyBankIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.contributionsUnavailableTitle)}
          description={t((m) => m.FamilyDashboard.contributionsUnavailableDesc)}
        />
      </DashboardSectionCard>
    );
  }

  const totals = contributions.totals ?? {};
  const plans = (contributions.plans ?? []).slice(0, 3);
  const cycles = (contributions.cycles ?? []).slice(0, 3);
  const activePlanCount = totals.activePlanCount ?? 0;
  const collectionRate = clampPercent(totals.collectionRatePercent ?? 0);
  const contributorsPaid = totals.contributorsPaid ?? 0;
  const contributorsExpected = totals.contributorsExpected ?? 0;
  const pendingVerificationCount = totals.pendingVerificationCount ?? 0;
  const overdueContributorCount = totals.overdueContributorCount ?? 0;

  const hasContributions =
    activePlanCount > 0 ||
    plans.length > 0 ||
    cycles.length > 0 ||
    (contributions.sourceRecordCount ?? 0) > 0;

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.contributionsTitle)}
      description={t((m) => m.FamilyDashboard.contributionsDesc)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.activePlansStat)}
          value={activePlanCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.cycleTargetStat)}
          value={
            <CompactMoney
              currency={currency}
              value={totals.expectedMinorUnits ?? 0}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.amountPaidStat)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          value={
            <CompactMoney
              currency={currency}
              value={totals.collectedMinorUnits ?? 0}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.amountRemainingStat)}
          value={
            <CompactMoney
              currency={currency}
              value={totals.outstandingMinorUnits ?? 0}
            />
          }
        />
      </div>

      {!hasContributions ? (
        <DashboardEmptyState
          icon={<PiggyBankIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noContributionsTitle)}
          description={t((m) => m.FamilyDashboard.noContributionsDesc)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">
                {t((m) => m.FamilyDashboard.memberProgressLabel)}
              </span>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                {t((m) => m.FamilyDashboard.memberProgressValue, {
                  paid: contributorsPaid,
                  expected: contributorsExpected,
                  rate: collectionRate,
                })}
              </span>
            </div>
            <Progress
              value={collectionRate}
              className="h-1.5 w-full"
              aria-label={t((m) => m.FamilyDashboard.collectionProgressAria, {
                rate: collectionRate,
              })}
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {t((m) => m.FamilyDashboard.pendingVerificationStat, {
                  count: pendingVerificationCount,
                })}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {t((m) => m.FamilyDashboard.overdueContributorsStat, {
                  count: overdueContributorCount,
                })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {plans.length > 0
              ? plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {plan.name}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {t((m) => m.FamilyDashboard.planExpectedPaid, {
                          collected: formatMinorUnits(
                            plan.collectedMinorUnits,
                            currency,
                          ),
                          expected: formatMinorUnits(
                            plan.expectedMinorUnits,
                            currency,
                          ),
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-mono"
                    >
                      {formatTitle(plan.cadence)}
                    </Badge>
                  </div>
                ))
              : cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {cycle.label}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {formatDate(cycle.dueDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] font-mono"
                    >
                      {cycle.percentCollected}%
                    </Badge>
                  </div>
                ))}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}

export function FamilyActiveProjectsCard({
  family,
  projects,
}: {
  family: FamilyDetail;
  projects: ProjectsOverview | null;
}) {
  const encodedSlug = encodeURIComponent(family.slug);
  const projectsHref = `/family/${encodedSlug}/projects`;
  const currency = projects?.currency ?? family.defaultCurrency;

  if (!projects) {
    return (
      <DashboardSectionCard
        title={t((m) => m.FamilyDashboard.projectsTitle)}
        description={t((m) => m.FamilyDashboard.projectsDesc)}
        actionHref={projectsHref}
        actionLabel={t((m) => m.FamilyDashboard.openProjects)}
      >
        <DashboardEmptyState
          icon={<FolderKanbanIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.projectsUnavailableTitle)}
          description={t((m) => m.FamilyDashboard.projectsUnavailableDesc)}
        />
      </DashboardSectionCard>
    );
  }

  const totals = projects.totals ?? {};
  const activeProjects = (projects.projects ?? []).slice(0, 3);
  const activeProjectCount = totals.activeProjectCount ?? activeProjects.length;
  const hasProjects =
    activeProjectCount > 0 ||
    activeProjects.length > 0 ||
    (projects.sourceRecordCount ?? 0) > 0;

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.projectsTitle)}
      description={t((m) => m.FamilyDashboard.projectsDesc)}
      actionHref={projectsHref}
      actionLabel={t((m) => m.FamilyDashboard.openProjects)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.activeProjectsStat)}
          value={activeProjectCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.plannedBudgetStat)}
          value={
            <CompactMoney
              currency={currency}
              value={totals.plannedMinorUnits ?? 0}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.contributionsReceivedStat)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          value={
            <CompactMoney
              currency={currency}
              value={totals.contributedMinorUnits ?? 0}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.remainingFundingStat)}
          value={
            <CompactMoney
              currency={currency}
              value={totals.outstandingMinorUnits ?? 0}
            />
          }
        />
      </div>

      {!hasProjects ? (
        <DashboardEmptyState
          icon={<FolderKanbanIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noProjectsTitle)}
          description={t((m) => m.FamilyDashboard.noProjectsDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {activeProjects.map((project) => {
            const progress = clampPercent(project.percentFunded ?? 0);
            const slug = createProjectSlug(project.name);
            return (
              <Link
                key={project.id}
                href={`${projectsHref}/${encodeURIComponent(slug)}`}
                className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 text-xs transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-foreground">
                    {project.name}
                  </p>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-mono"
                  >
                    {project.status
                      ? formatTitle(project.status)
                      : `${progress}%`}
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  className="h-1.5 w-full"
                  aria-label={t((m) => m.FamilyDashboard.projectProgressAria, {
                    name: project.name,
                    progress,
                  })}
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">
                    {t((m) => m.FamilyDashboard.projectFundedOfPlanned, {
                      contributed: formatMinorUnits(
                        project.contributedMinorUnits,
                        currency,
                      ),
                      planned: formatMinorUnits(
                        project.targetAmountMinorUnits,
                        currency,
                      ),
                    })}
                  </span>
                  <span className="shrink-0">
                    {project.targetDate
                      ? t((m) => m.FamilyDashboard.projectTargetDate, {
                          date: formatDate(project.targetDate),
                        })
                      : t((m) => m.FamilyDashboard.projectNoTargetDate)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}

export function FamilyLoansOverviewCard({
  family,
  loans,
}: {
  family: FamilyDetail;
  loans: LoanRecord[] | null;
}) {
  const encodedSlug = encodeURIComponent(family.slug);
  const loansHref = `/family/${encodedSlug}/money/loans`;
  const currency = family.defaultCurrency;

  if (!loans) {
    return (
      <DashboardSectionCard
        title={t((m) => m.FamilyDashboard.loansCardTitle)}
        description={t((m) => m.FamilyDashboard.loansCardDesc)}
        actionHref={loansHref}
        actionLabel={t((m) => m.FamilyDashboard.openLoans)}
      >
        <DashboardEmptyState
          icon={<HandCoinsIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.loansUnavailableTitle)}
          description={t((m) => m.FamilyDashboard.loansUnavailableDesc)}
        />
      </DashboardSectionCard>
    );
  }

  const summary = summarizeFamilyLoans(loans);
  const hasLoans =
    summary.borrowedMinorUnits > 0n ||
    summary.lentMinorUnits > 0n ||
    summary.remainingMinorUnits > 0n ||
    summary.urgentLoans.length > 0;

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.loansCardTitle)}
      description={t((m) => m.FamilyDashboard.loansCardDesc)}
      actionHref={loansHref}
      actionLabel={t((m) => m.FamilyDashboard.openLoans)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.totalBorrowedStat)}
          value={
            <CompactMoney
              currency={currency}
              value={summary.borrowedMinorUnits.toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.totalLentStat)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          value={
            <CompactMoney
              currency={currency}
              value={summary.lentMinorUnits.toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.remainingBalanceStat)}
          value={
            <CompactMoney
              currency={currency}
              value={summary.remainingMinorUnits.toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.overdue)}
          valueClassName={
            summary.overdueCount > 0 ? "text-destructive" : undefined
          }
          value={
            <div className="flex flex-wrap items-center gap-1.5">
              <span>{summary.overdueCount}</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-mono"
              >
                {t((m) => m.FamilyDashboard.dueSoonLoansStat, {
                  count: summary.dueSoonCount,
                })}
              </Badge>
            </div>
          }
        />
      </div>

      {!hasLoans ? (
        <DashboardEmptyState
          icon={<HandCoinsIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noLoansTitle)}
          description={t((m) => m.FamilyDashboard.noLoansDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {summary.urgentLoans.map((loan) => {
            const progress = getLoanProgress(loan);
            const counterparty =
              loan.type === "MONEY_BORROWED" ? loan.lender : loan.borrower;
            const overdue = isLoanOverdue(loan);

            return (
              <div
                key={loan.id}
                className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 text-xs transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        overdue
                          ? "bg-destructive"
                          : loan.type === "MONEY_LENT"
                            ? "bg-emerald-500"
                            : "bg-amber-500",
                      )}
                      aria-hidden="true"
                    />
                    <p className="truncate font-semibold text-foreground">
                      {loan.title}
                    </p>
                  </div>
                  <Badge
                    variant={overdue ? "destructive" : "outline"}
                    className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-mono"
                  >
                    {loan.type === "MONEY_BORROWED"
                      ? t((m) => m.FamilyDashboard.borrowedBadge)
                      : t((m) => m.FamilyDashboard.lentBadge)}
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  className="h-1.5 w-full"
                  aria-label={t((m) => m.FamilyDashboard.loanRepaidAria, {
                    title: loan.title,
                    progress,
                  })}
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">
                    {loan.dueDate
                      ? t((m) => m.FamilyDashboard.loanCounterpartyDue, {
                          name: counterparty,
                          date: formatDate(loan.dueDate),
                        })
                      : t((m) => m.FamilyDashboard.loanCounterpartyNoDue, {
                          name: counterparty,
                        })}
                  </span>
                  <CompactMoney
                    className="font-mono font-medium text-foreground shrink-0"
                    currency={currency}
                    value={loan.remainingBalanceMinorUnits}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
