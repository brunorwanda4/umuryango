import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  LandmarkIcon,
  PlusIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS, hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import type { MoneyMinorValue, MoneyOverview } from "../money/types";
import {
  formatDate,
  formatTitle,
  normalizeMinorUnitString,
  normalizeMoneyOverview,
} from "../money/utils";
import type { FamilyDetail } from "./types";

const t = createTranslator("FamilyDashboard");
const tCommon = createTranslator("Common");

const cardClassName = "card card-border gap-0 rounded-[20px] py-5 shadow-sm";

export function FamilyFinanceDashboard({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const normalizedMoney = normalizeMoneyOverview(money ?? undefined);
  const currency = normalizedMoney?.currency ?? family.defaultCurrency;
  const totals = normalizedMoney?.totals;
  const records = normalizedMoney?.records ?? [];
  const approvals = normalizedMoney?.approvals ?? [];
  const moneyHref = `/family/${encodeURIComponent(family.slug)}/money`;
  const incomeShare = getShare(
    totals?.incomeMinorUnits,
    totals?.expenseMinorUnits,
  );

  const dashboardStats = [
    {
      label: t("pendingApprovals"),
      value: totals?.pendingApprovalCount ?? 0,
      valueClassName: "text-[var(--chart-4)]",
    },
    {
      label: t("moneyRecords"),
      value: normalizedMoney?.sourceRecordCount ?? records.length,
      valueClassName: "text-[var(--chart-2)]",
    },
    {
      label: t("overdue"),
      value: totals?.overdueCount ?? 0,
      valueClassName: "text-[var(--chart-5)]",
    },
    {
      label: t("familyMembers"),
      value: family.memberCount,
      valueClassName: "text-[var(--chart-1)]",
    },
  ];

  return (
    <section
      className="flex flex-col gap-4"
      aria-label={t("overviewAriaLabel")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card className="family-balance-card gap-0 rounded-[22px] border py-[22px] text-white shadow-xl">
          <CardHeader className="px-[22px]">
            <CardDescription className="font-mono font-semibold text-[17px] text-white/90 tracking-[0.14em] uppercase">
              {t("totalBalance", { currency })}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-7 flex flex-1 flex-col px-[22px]">
            <CompactMoney
              className="mt-2 font-mono font-semibold text-4xl tracking-[0.06em] sm:text-5xl"
              currency={currency}
              value={totals?.cashBalanceMinorUnits ?? 0}
            />
            <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
              <BalanceStat
                currency={currency}
                label={t("incomeThisMonth")}
                value={totals?.incomeMinorUnits ?? 0}
              />
              <BalanceStat
                currency={currency}
                label={t("spentThisMonth")}
                value={totals?.expenseMinorUnits ?? 0}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={cardClassName}>
          <CardContent className="grid h-full grid-cols-2 gap-2.5 px-5">
            {dashboardStats.map((stat) => (
              <div
                className="stat rounded-[14px] border bg-muted p-3.5"
                key={stat.label}
              >
                <div className="stat-title text-muted-foreground text-[13px]">
                  {stat.label}
                </div>
                <div
                  className={cn(
                    "stat-value mt-1 font-fraunces text-[22px]",
                    stat.valueClassName,
                  )}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:max-w-[620px]">
        {hasCapability(family, "RECORD_INCOME") ? (
          <DashboardAction
            href={`${moneyHref}/income`}
            icon={ArrowDownLeftIcon}
            iconClassName="text-[var(--chart-2)]"
            label={t("addIncome")}
          />
        ) : null}
        {hasCapability(family, "RECORD_EXPENSE") ? (
          <DashboardAction
            href={`${moneyHref}/expenses`}
            icon={ArrowUpRightIcon}
            iconClassName="text-destructive"
            label={t("addExpense")}
          />
        ) : null}
        {hasCapability(family, "MANAGE_DEBTS") ? (
          <DashboardAction
            href={`${moneyHref}/loans`}
            icon={PlusIcon}
            label={t("addLoan")}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashboardCard
          actionHref={moneyHref}
          actionLabel={tCommon("open")}
          description={t("moneyThisMonthDesc")}
          title={t("moneyThisMonthTitle")}
        >
          <div
            className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t("moneyShareAria", {
              incomeShare,
              expenseShare: 100 - incomeShare,
            })}
          >
            <span
              className="bg-[var(--chart-2)]"
              style={{ width: `${incomeShare}%` }}
            />
            <span
              className="bg-destructive"
              style={{ width: `${100 - incomeShare}%` }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-4 text-muted-foreground text-[13px]">
            <LegendItem
              className="bg-[var(--chart-2)]"
              currency={currency}
              label={t("income")}
              value={totals?.incomeMinorUnits ?? 0}
            />
            <LegendItem
              className="bg-destructive"
              currency={currency}
              label={t("expenses")}
              value={totals?.expenseMinorUnits ?? 0}
            />
          </div>
          {records.length ? (
            <RecordList currency={currency} records={records.slice(0, 4)} />
          ) : (
            <DashboardEmpty
              description={t("noTransactionsDesc")}
              icon={WalletCardsIcon}
              title={t("noTransactionsTitle")}
            />
          )}
        </DashboardCard>

        <DashboardCard
          actionHref={`${moneyHref}/approvals`}
          actionLabel={tCommon("viewAll")}
          description={t("moneyToReviewDesc")}
          title={t("moneyToReviewTitle")}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <MetricStat
              label={t("pendingApprovals")}
              value={totals?.pendingApprovalCount ?? 0}
              valueClassName="text-[var(--chart-5)]"
            />
            <MetricStat
              label={t("overdue")}
              value={totals?.overdueCount ?? 0}
              valueClassName="text-[var(--chart-1)]"
            />
          </div>
          {approvals.length ? (
            <div className="mt-3.5 flex flex-col">
              {approvals.slice(0, 2).map((approval, index) => (
                <div key={approval.id}>
                  {index ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[15px]">
                        {approval.title}
                      </p>
                      <p className="text-muted-foreground text-[13px]">
                        {approval.status ?? t("pendingReview")}
                      </p>
                    </div>
                    <CompactMoney
                      currency={currency}
                      value={approval.amountMinorUnits}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmpty
              description={t("nothingNeedsAttentionDesc")}
              icon={CalendarCheckIcon}
              title={t("nothingNeedsAttentionTitle")}
            />
          )}
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FamilyWorkspaceCard family={family} />
        <LoansCard
          currency={currency}
          debt={totals?.debtOutstandingMinorUnits}
          href={`${moneyHref}/loans`}
          savings={totals?.savingsMinorUnits}
        />
      </div>
    </section>
  );
}

export function FamilyQuickActions({ family }: { family: FamilyDetail }) {
  const moneyHref = `/family/${encodeURIComponent(family.slug)}/money`;
  const actions = [
    {
      label: t("addIncome"),
      href: `${moneyHref}/income`,
      icon: ArrowDownLeftIcon,
      iconClassName: "text-[var(--chart-2)]",
      capability: "RECORD_INCOME" as const,
    },
    {
      label: t("addExpense"),
      href: `${moneyHref}/expenses`,
      icon: ArrowUpRightIcon,
      iconClassName: "text-destructive",
      capability: "RECORD_EXPENSE" as const,
    },
    {
      label: t("addLoan"),
      href: `${moneyHref}/loans`,
      icon: LandmarkIcon,
      capability: "MANAGE_DEBTS" as const,
    },
    {
      label: t("openMoney"),
      href: moneyHref,
      icon: WalletCardsIcon,
      capability: null,
    },
  ].filter(
    (action) =>
      action.capability === null || hasCapability(family, action.capability),
  );

  return (
    <Card className={cardClassName}>
      <CardHeader className="px-5 pb-3.5">
        <CardTitle className="font-fraunces text-xl">
          {t("quickActionsTitle")}
        </CardTitle>
        <CardDescription>{t("quickActionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2.5 px-5 sm:grid-cols-2">
        {actions.map((action) => (
          <DashboardAction key={action.label} {...action} />
        ))}
      </CardContent>
    </Card>
  );
}

function BalanceStat({
  currency,
  label,
  value,
}: {
  currency: string;
  label: string;
  value: MoneyMinorValue;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/6 p-3">
      <small className="block text-white/70 text-[13px]">{label}</small>
      <CompactMoney
        className="mt-1 block font-mono font-semibold text-lg"
        currency={currency}
        value={value}
      />
    </div>
  );
}

function DashboardAction({
  href,
  icon: Icon,
  iconClassName,
  label,
}: {
  href: string;
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
}) {
  return (
    <Button
      asChild
      className="h-auto min-h-[74px] flex-col items-start gap-2.5 rounded-[14px] p-3.5"
      variant="outline"
    >
      <Link href={href}>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-[10px] bg-muted",
            iconClassName,
          )}
        >
          <Icon aria-hidden="true" />
        </span>
        {label}
      </Link>
    </Button>
  );
}

function DashboardCard({
  actionHref,
  actionLabel,
  children,
  description,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Card className={cardClassName}>
      <CardHeader className="px-5 pb-3.5">
        <CardTitle className="font-fraunces text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}

function DashboardEmpty({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Empty className="mt-[18px] min-h-40 rounded-[14px] border border-dashed p-7">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="font-fraunces text-lg">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function LegendItem({
  className,
  currency,
  label,
  value,
}: {
  className: string;
  currency: string;
  label: string;
  value: MoneyMinorValue;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("size-2 rounded-full", className)} aria-hidden="true" />
      {label}
      <CompactMoney currency={currency} value={value} />
    </span>
  );
}

function MetricStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName: string;
}) {
  return (
    <div className=" rounded-[14px] border bg-muted p-3.5">
      <div className="stat-title text-muted-foreground text-[13px]">
        {label}
      </div>
      <div
        className={cn(
          "stat-value mt-1 font-fraunces text-[22px]",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function RecordList({
  currency,
  records,
}: {
  currency: string;
  records: NonNullable<MoneyOverview["records"]>;
}) {
  return (
    <div className="mt-3.5 flex flex-col">
      {records.map((record, index) => {
        const isIncome = record.type.toLowerCase().includes("income");

        return (
          <div key={record.id}>
            {index ? <Separator /> : null}
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[15px]">
                  {record.category ?? formatTitle(record.title)}
                </p>
                <p className="text-muted-foreground text-[13px]">
                  {formatDate(record.date)}
                </p>
              </div>
              <CompactMoney
                className={cn(
                  "font-semibold",
                  isIncome ? "text-[var(--chart-2)]" : "text-destructive",
                )}
                currency={currency}
                value={record.amountMinorUnits}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FamilyWorkspaceCard({ family }: { family: FamilyDetail }) {
  const href = `/family/${encodeURIComponent(family.slug)}/members`;

  return (
    <DashboardCard
      actionHref={href}
      actionLabel={tCommon("viewAll")}
      description={t("familyWorkspaceDesc")}
      title={t("familyWorkspaceTitle")}
    >
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UsersIcon aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[15px]">
              {family.name}{" "}
              <Badge variant="secondary">
                {AUTHORITY_LABELS[family.authority]}
              </Badge>
            </p>
            <p className="text-muted-foreground text-[13px]">
              {t("membersCount", { count: family.memberCount })}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{tCommon("open")}</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

function LoansCard({
  currency,
  debt,
  href,
  savings,
}: {
  currency: string;
  debt: MoneyMinorValue | null | undefined;
  href: string;
  savings: MoneyMinorValue | null | undefined;
}) {
  return (
    <DashboardCard
      actionHref={href}
      actionLabel={tCommon("open")}
      description={t("savingsAndDebtsDesc")}
      title={t("savingsAndDebtsTitle")}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <MoneyStat
          className="text-destructive"
          currency={currency}
          label={t("outstandingDebts")}
          value={debt}
        />
        <MoneyStat
          className="text-[var(--chart-2)]"
          currency={currency}
          label={t("familySavings")}
          value={savings}
        />
      </div>
      {!hasAmount(debt) && !hasAmount(savings) ? (
        <DashboardEmpty
          description={t("noSavingsOrDebtsDesc")}
          icon={LandmarkIcon}
          title={t("noSavingsOrDebtsTitle")}
        />
      ) : null}
    </DashboardCard>
  );
}

function MoneyStat({
  className,
  currency,
  label,
  value,
}: {
  className: string;
  currency: string;
  label: string;
  value: MoneyMinorValue | null | undefined;
}) {
  return (
    <div className="stat rounded-[14px] border bg-muted p-3.5">
      <div className="stat-title text-muted-foreground text-[13px]">
        {label}
      </div>
      <div className={cn("stat-value mt-1 text-[22px]", className)}>
        <CompactMoney
          currency={currency}
          emptyLabel={t("noRecords")}
          value={value}
        />
      </div>
    </div>
  );
}

function hasAmount(value: MoneyMinorValue | null | undefined) {
  const normalized = normalizeMinorUnitString(value);

  return normalized !== null && BigInt(normalized) !== BigInt(0);
}

function getShare(
  income: MoneyMinorValue | null | undefined,
  expenses: MoneyMinorValue | null | undefined,
) {
  const normalizedIncome = normalizeMinorUnitString(income);
  const normalizedExpenses = normalizeMinorUnitString(expenses);
  const incomeValue = BigInt(normalizedIncome ?? 0);
  const expenseValue = BigInt(normalizedExpenses ?? 0);
  const total = incomeValue + expenseValue;

  if (total <= BigInt(0)) return 0;

  return Number((incomeValue * BigInt(100)) / total);
}
