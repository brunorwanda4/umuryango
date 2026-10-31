import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";

export function PersonalSummaryCards({ data }: { data: PersonalOverviewData }) {
  const t = createTranslator("PersonalOverview.summaryCards");
  const allIncome = data.income?.summary.allTimeTotalMinorUnits;
  const allExpenses = data.expenses?.summary.allTimeTotalMinorUnits;
  const balance = addMinorUnits(allIncome) - addMinorUnits(allExpenses);
  const income = data.income?.summary.periodTotalMinorUnits ?? "0";
  const expenses = data.expenses?.summary.periodTotalMinorUnits ?? "0";
  const activePlans = data.plans.filter(
    (plan) => plan.status === "PENDING" || plan.status === "IN_PROGRESS",
  ).length;
  const activeLoans = data.loans.filter(
    (loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE",
  ).length;
  const moneyAvailable = Boolean(data.income && data.expenses);
  const cardClassName = "card card-border gap-0 rounded-[20px] py-5 shadow-sm";
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
      <Card className="family-balance-card gap-0 rounded-[22px] border py-[22px] text-white shadow-xl">
        <CardHeader className="px-[22px]">
          <CardDescription className="font-mono text-[17px] font-semibold uppercase tracking-[0.14em] text-white/90">
            {t("totalBalance", { currency: data.currency })}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-7 flex flex-1 flex-col px-[22px]">
          <Link href="/me/money" className="block">
            <CompactMoney
              className="mt-2 font-mono text-4xl font-semibold tracking-[0.06em] text-white sm:text-5xl"
              currency={data.currency}
              value={moneyAvailable ? balance.toString() : 0}
            />
            {!moneyAvailable ? (
              <p className="mt-2 text-sm text-white/70">
                {t("moneyUnavailable")}
              </p>
            ) : null}
          </Link>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
            <BalanceStat
              currency={data.currency}
              label={t("incomeThisMonth")}
              value={income}
            />
            <BalanceStat
              currency={data.currency}
              label={t("spentThisMonth")}
              value={expenses}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={cardClassName}>
        <CardHeader className="px-5 pb-3.5">
          <CardTitle className="font-fraunces text-xl">
            {t("quickAddTitle")}
          </CardTitle>
          <CardDescription>{t("quickAddDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-5">
          <div className="grid grid-cols-3 gap-2">
            <SummaryMetric label={t("activePlans")} value={activePlans} />
            <SummaryMetric label={t("activeLoans")} value={activeLoans} />
            <SummaryMetric
              label={t("workspaces")}
              value={data.families.length}
            />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <QuickAddLink
              href="/me/money/income"
              label={t("addIncome")}
              icon={ArrowDownLeftIcon}
              iconClassName="text-emerald-500"
            />
            <QuickAddLink
              href="/me/money/expenses"
              label={t("addExpense")}
              icon={ArrowUpRightIcon}
              iconClassName="text-destructive"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceStat({
  currency,
  label,
  value,
}: {
  currency: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/6 p-3">
      <small className="block text-[13px] text-white/70">{label}</small>
      <CompactMoney
        className="mt-1 block font-mono text-lg font-semibold text-white"
        currency={currency}
        value={value}
      />
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-2.5">
      <p className="text-muted-foreground text-[11px] leading-tight">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function QuickAddLink({
  href,
  label,
  icon: Icon,
  iconClassName,
}: {
  href: string;
  label: string;
  icon: typeof ArrowDownLeftIcon;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[74px] flex-col items-start gap-2.5 rounded-[14px] border p-3.5 transition-colors hover:bg-muted"
    >
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-muted">
        <Icon className={iconClassName} aria-hidden="true" />
      </span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
