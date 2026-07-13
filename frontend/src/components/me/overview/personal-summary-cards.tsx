import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";
import { link } from "node:fs/promises";

export function PersonalSummaryCards({ data }: { data: PersonalOverviewData }) {
  const allIncome = data.income?.summary.allTimeTotalMinorUnits;
  const allExpenses = data.expenses?.summary.allTimeTotalMinorUnits;
  const balance = addMinorUnits(allIncome) - addMinorUnits(allExpenses);
  const activePlans = data.plans.filter(
    (plan) => plan.status === "PENDING" || plan.status === "IN_PROGRESS",
  ).length;
  const activeLoans = data.loans.filter(
    (loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE",
  ).length;
  const moneyAvailable = Boolean(data.income && data.expenses);

  const cards = [
    {
      description: "Total balance",
      value: moneyAvailable ? (
        <CompactMoney currency={data.currency} value={balance.toString()} />
      ) : (
        "—"
      ),
      footer: moneyAvailable
        ? "Income less expenses"
        : "Money data unavailable",
      iconImage: "/images/icons/wallet.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/me/money",
    },
    {
      description: "This month income",
      value: data.income ? (
        <CompactMoney
          currency={data.currency}
          value={data.income.summary.periodTotalMinorUnits}
        />
      ) : (
        "—"
      ),
      footer: `${data.income?.summary.transactionCount ?? 0} records this month`,
      iconImage: "/images/icons/income.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/me/money/income",
    },
    {
      description: "This month expenses",
      value: data.expenses ? (
        <CompactMoney
          currency={data.currency}
          value={data.expenses.summary.periodTotalMinorUnits}
        />
      ) : (
        "—"
      ),
      footer: `${data.expenses?.summary.transactionCount ?? 0} records this month`,
      iconImage: "/images/icons/expense.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/me/money/expenses",
    },
    {
      description: "Active plans",
      value: activePlans.toLocaleString(),
      footer: `${data.plans.filter((plan) => plan.status === "COMPLETED").length} completed`,
      iconImage: "/images/icons/plan.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/me/plans",
    },
    {
      description: "Active loans",
      value: activeLoans.toLocaleString(),
      footer: `${data.loans.filter((loan) => loan.status === "OVERDUE").length} overdue`,
      iconImage: "/images/icons/loan.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/me/money/loans",
    },
    {
      description: "Family workspaces",
      value: data.families.length.toLocaleString(),
      footer:
        data.families.length === 1
          ? "1 workspace available"
          : "Workspaces available",
      iconImage: "/images/icons/family.png",
      className: "rounded-2xl border-border/80 py-0 shadow-sm",
      link: "/family",
    },
  ];

  return (
    <CommonOverviewCardDisplay
      className="grid-cols-1 gap-3 lg:grid-cols-3 2xl:grid-cols-6"
      cardHeaderClassName="min-h-[10.75rem] flex-col items-start justify-between gap-4 p-5 sm:p-6"
      cardDescriptionClassName="text-sm font-medium text-muted-foreground"
      cardTitleClassName="whitespace-normal leading-tight sm:text-2xl"
      iconPosition="start"
      cards={cards}
    />
  );
}
