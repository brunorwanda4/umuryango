"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  CheckSquareIcon,
  FileBarChart2Icon,
  FolderKanbanIcon,
  HandCoinsIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  DashboardActionGrid,
  DashboardActionTile,
  DashboardQuickAddTile,
} from "@/components/common/dashboard/dashboard-action-grid";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "@/components/common/dashboard/dashboard-balance-card";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import {
  DashboardStatTile,
  DashboardSummaryMetric,
} from "@/components/common/dashboard/dashboard-metric-card";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import {
  buildAttentionItems,
  getFamilyQuickActions,
  summarizeFamilyLoans,
  toBigIntMinorUnits,
} from "./dashboard-data";
import type {
  ContributionsOverview,
  FamilyAttentionItem,
  FamilyDetail,
  FamilyMemberSummary,
  FamilyQuickActionId,
  RejectedTransactionRow,
} from "./types";

const t = createTranslator("FamilyDashboard");

function getQuickActionMeta(id: FamilyQuickActionId) {
  switch (id) {
    case "add-income":
      return {
        label: t((m) => m.FamilyDashboard.addIncome),
        icon: (
          <ArrowDownLeftIcon className="text-emerald-500" aria-hidden="true" />
        ),
        buttonIcon: (
          <ArrowDownLeftIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "add-expense":
      return {
        label: t((m) => m.FamilyDashboard.addExpense),
        icon: (
          <ArrowUpRightIcon className="text-destructive" aria-hidden="true" />
        ),
        buttonIcon: (
          <ArrowUpRightIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "add-loan":
      return {
        label: t((m) => m.FamilyDashboard.addLoan),
        icon: <HandCoinsIcon aria-hidden="true" />,
        buttonIcon: (
          <HandCoinsIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "create-project":
      return {
        label: t((m) => m.FamilyDashboard.createProject),
        icon: <FolderKanbanIcon aria-hidden="true" />,
        buttonIcon: (
          <FolderKanbanIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "invite-member":
      return {
        label: t((m) => m.FamilyDashboard.inviteMember),
        icon: <UserPlusIcon aria-hidden="true" />,
        buttonIcon: (
          <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "review-approvals":
      return {
        label: t((m) => m.FamilyDashboard.reviewApprovals),
        icon: <CheckSquareIcon aria-hidden="true" />,
        buttonIcon: (
          <CheckSquareIcon data-icon="inline-start" aria-hidden="true" />
        ),
      };
    case "open-reports":
      return {
        label: t((m) => m.FamilyDashboard.openReports),
        icon: <FileBarChart2Icon aria-hidden="true" />,
        buttonIcon: (
          <FileBarChart2Icon data-icon="inline-start" aria-hidden="true" />
        ),
      };
  }
}

export function FamilyFinancialSummary({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const normalizedMoney = normalizeMoneyOverview(money ?? undefined);
  const currency = normalizedMoney?.currency ?? family.defaultCurrency;
  const totals = normalizedMoney?.totals;
  const moneyAvailable = normalizedMoney !== null;
  const encodedSlug = encodeURIComponent(family.slug);
  const moneyHref = `/family/${encodedSlug}/money`;
  const canApproveExpense = hasCapability(family, "APPROVE_EXPENSE");
  const quickActions = getFamilyQuickActions(family);
  const primaryActions = quickActions.slice(0, 2);
  const cardClassName = "card card-border gap-0 rounded-[20px] py-5 shadow-sm";

  return (
    <section
      aria-label={t((m) => m.FamilyDashboard.overviewAriaLabel)}
      className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]"
    >
      <DashboardBalanceCard
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
        />
        <DashboardBalanceStat
          href={`${moneyHref}/expenses`}
          currency={currency}
          label={t((m) => m.FamilyDashboard.spentThisMonth)}
          value={totals?.expenseMinorUnits ?? 0}
        />
      </DashboardBalanceCard>

      <Card className={cardClassName}>
        <CardHeader className="px-5 pb-3.5">
          <CardTitle className="font-fraunces text-xl">
            {t((m) => m.FamilyDashboard.quickAddTitle)}
          </CardTitle>
          <CardDescription>
            {t((m) => m.FamilyDashboard.quickAddDesc)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DashboardSummaryMetric
              href={canApproveExpense ? `${moneyHref}/approvals` : moneyHref}
              label={t((m) => m.FamilyDashboard.pendingApprovals)}
              value={
                moneyAvailable ? String(totals?.pendingApprovalCount ?? 0) : "—"
              }
            />
            <DashboardSummaryMetric
              href={moneyHref}
              label={t((m) => m.FamilyDashboard.overdue)}
              value={moneyAvailable ? String(totals?.overdueCount ?? 0) : "—"}
            />
            <DashboardSummaryMetric
              href={moneyHref}
              label={t((m) => m.FamilyDashboard.moneyRecords)}
              value={
                moneyAvailable
                  ? String(
                      normalizedMoney.sourceRecordCount ??
                        normalizedMoney.records?.length ??
                        0,
                    )
                  : "—"
              }
            />
            <DashboardSummaryMetric
              href={`/family/${encodedSlug}/members`}
              label={t((m) => m.FamilyDashboard.familyMembers)}
              value={String(family.memberCount || family.members.length)}
            />
          </div>

          {primaryActions.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {primaryActions.map((action) => {
                const meta = getQuickActionMeta(action.id);
                return (
                  <DashboardQuickAddTile
                    key={action.id}
                    href={action.href}
                    label={meta.label}
                    icon={meta.icon}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              {t((m) => m.FamilyDashboard.noQuickActionsDesc)}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function FamilyQuickActionsCard({ family }: { family: FamilyDetail }) {
  const quickActions = getFamilyQuickActions(family);

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.quickActionsTitle)}
      description={t((m) => m.FamilyDashboard.quickActionsDesc)}
    >
      <DashboardActionGrid className="sm:grid-cols-3 lg:grid-cols-4">
        {quickActions.map((action) => {
          const meta = getQuickActionMeta(action.id);
          return (
            <DashboardActionTile
              key={action.id}
              href={action.href}
              icon={meta.buttonIcon}
              label={meta.label}
            />
          );
        })}
      </DashboardActionGrid>
    </DashboardSectionCard>
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
          <ChartContainer
            config={chartConfig}
            className="h-44 w-full aspect-auto"
            initialDimension={{ height: 176, width: 560 }}
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
          <Separator />
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">
              {t((m) => m.FamilyDashboard.recentTransactionsTitle)}
            </p>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t((m) => m.FamilyDashboard.noRecentTransactions)}
              </p>
            ) : (
              records.map((record) => {
                const statusUpper = (record.status ?? "").toUpperCase();
                return (
                  <Link
                    key={record.id}
                    href={moneyHref}
                    className="flex items-center justify-between gap-3 rounded-lg py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-medium text-sm">
                          {record.title}
                        </p>
                        {record.status ? (
                          <Badge variant="outline" className="text-[11px]">
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
                      </div>
                      <p className="truncate text-muted-foreground text-xs">
                        {record.category ?? formatTitle(record.type)}
                        {record.createdBy ? ` · ${record.createdBy}` : ""} ·{" "}
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <CompactMoney
                      className="shrink-0 font-medium"
                      currency={currency}
                      value={record.amountMinorUnits ?? 0}
                    />
                  </Link>
                );
              })
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
      <div className="grid grid-cols-3 gap-3">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.pendingApprovals)}
          value={money === null ? "—" : pendingApprovalsCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.overdue)}
          value={money === null ? "—" : overdueCount}
        />
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.pendingReview)}
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
        <div className="flex flex-col gap-3">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-lg py-1 transition-colors hover:bg-muted/50"
              >
                <AttentionItemRow item={item} />
              </Link>
            ) : (
              <div key={item.id} className="py-1">
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
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-medium text-sm">{item.title}</p>
          <Badge
            variant={
              item.kind === "overdue-record" || item.kind === "rejected-record"
                ? "destructive"
                : "outline"
            }
          >
            {getAttentionBadgeLabel(item.kind)}
          </Badge>
        </div>
        <p className="truncate text-muted-foreground text-xs">
          {item.subtitle}
          {item.date ? ` · ${formatDate(item.date)}` : ""}
        </p>
      </div>
      <CompactMoney
        className="shrink-0 font-medium"
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
      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium">
                {t((m) => m.FamilyDashboard.memberProgressLabel)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {t((m) => m.FamilyDashboard.memberProgressValue, {
                  paid: contributorsPaid,
                  expected: contributorsExpected,
                  rate: collectionRate,
                })}
              </span>
            </div>
            <Progress
              value={collectionRate}
              aria-label={t((m) => m.FamilyDashboard.collectionProgressAria, {
                rate: collectionRate,
              })}
            />
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Badge variant="outline">
                {t((m) => m.FamilyDashboard.pendingVerificationStat, {
                  count: pendingVerificationCount,
                })}
              </Badge>
              <Badge variant="outline">
                {t((m) => m.FamilyDashboard.overdueContributorsStat, {
                  count: overdueContributorCount,
                })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {plans.length > 0
              ? plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {plan.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
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
                    <Badge variant="outline">{formatTitle(plan.cadence)}</Badge>
                  </div>
                ))
              : cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {cycle.label}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(cycle.dueDate)}
                      </p>
                    </div>
                    <Badge variant="outline">{cycle.percentCollected}%</Badge>
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
      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-4">
          {activeProjects.map((project) => {
            const progress = clampPercent(project.percentFunded ?? 0);
            const slug = createProjectSlug(project.name);
            return (
              <Link
                key={project.id}
                href={`${projectsHref}/${encodeURIComponent(slug)}`}
                className="flex flex-col gap-2 rounded-lg py-1 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {project.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t((m) => m.FamilyDashboard.projectFundedOfPlanned, {
                        contributed: formatMinorUnits(
                          project.contributedMinorUnits,
                          currency,
                        ),
                        planned: formatMinorUnits(
                          project.targetAmountMinorUnits,
                          currency,
                        ),
                      })}{" "}
                      ·{" "}
                      {project.targetDate
                        ? t((m) => m.FamilyDashboard.projectTargetDate, {
                            date: formatDate(project.targetDate),
                          })
                        : t((m) => m.FamilyDashboard.projectNoTargetDate)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {project.status
                      ? formatTitle(project.status)
                      : `${progress}%`}
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  aria-label={t((m) => m.FamilyDashboard.projectProgressAria, {
                    name: project.name,
                    progress,
                  })}
                />
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
      <div className="grid grid-cols-2 gap-3">
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
          value={
            <div className="flex flex-wrap items-center gap-1.5">
              <span>{summary.overdueCount}</span>
              <Badge variant="outline" className="text-[11px]">
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
        <div className="flex flex-col gap-4">
          {summary.urgentLoans.map((loan) => {
            const progress = getLoanProgress(loan);
            const counterparty =
              loan.type === "MONEY_BORROWED" ? loan.lender : loan.borrower;
            const overdue = isLoanOverdue(loan);
            return (
              <div key={loan.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{loan.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {loan.dueDate
                        ? t((m) => m.FamilyDashboard.loanCounterpartyDue, {
                            name: counterparty,
                            date: formatDate(loan.dueDate),
                          })
                        : t((m) => m.FamilyDashboard.loanCounterpartyNoDue, {
                            name: counterparty,
                          })}
                    </p>
                  </div>
                  <Badge variant={overdue ? "destructive" : "outline"}>
                    {loan.type === "MONEY_BORROWED"
                      ? t((m) => m.FamilyDashboard.borrowedBadge)
                      : t((m) => m.FamilyDashboard.lentBadge)}
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  aria-label={t((m) => m.FamilyDashboard.loanRepaidAria, {
                    title: loan.title,
                    progress,
                  })}
                />
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
