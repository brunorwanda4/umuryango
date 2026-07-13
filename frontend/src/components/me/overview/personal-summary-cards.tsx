import type { LucideIcon } from "lucide-react";
import {
  CalendarCheckIcon,
  LandmarkIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalOverviewData } from "./personal-overview-data";
import { addMinorUnits } from "./personal-overview-data";

type SummaryItem = {
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: LucideIcon;
};

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
  const items: SummaryItem[] = [
    {
      label: "Total balance",
      value: moneyAvailable ? (
        <CompactMoney currency={data.currency} value={balance.toString()} />
      ) : (
        "—"
      ),
      helper: moneyAvailable
        ? "Income less expenses"
        : "Money data unavailable",
      icon: WalletIcon,
    },
    {
      label: "This month income",
      value: data.income ? (
        <CompactMoney
          currency={data.currency}
          value={data.income.summary.periodTotalMinorUnits}
        />
      ) : (
        "—"
      ),
      helper: `${data.income?.summary.transactionCount ?? 0} records this month`,
      icon: TrendingUpIcon,
    },
    {
      label: "This month expenses",
      value: data.expenses ? (
        <CompactMoney
          currency={data.currency}
          value={data.expenses.summary.periodTotalMinorUnits}
        />
      ) : (
        "—"
      ),
      helper: `${data.expenses?.summary.transactionCount ?? 0} records this month`,
      icon: TrendingDownIcon,
    },
    {
      label: "Active plans",
      value: activePlans.toLocaleString(),
      helper: `${data.plans.filter((plan) => plan.status === "COMPLETED").length} completed`,
      icon: CalendarCheckIcon,
    },
    {
      label: "Active loans",
      value: activeLoans.toLocaleString(),
      helper: `${data.loans.filter((loan) => loan.status === "OVERDUE").length} overdue`,
      icon: LandmarkIcon,
    },
    {
      label: "Family workspaces",
      value: data.families.length.toLocaleString(),
      helper:
        data.families.length === 1
          ? "1 workspace available"
          : "Workspaces available",
      icon: UsersIcon,
    },
  ];

  return (
    <section
      aria-label="Personal summary"
      className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6"
    >
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              {item.label}
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <item.icon className="size-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="font-semibold text-xl tracking-tight sm:text-2xl">
              {item.value}
            </p>
            <p className="text-muted-foreground text-xs">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
