import {
  FileBarChartIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  PieChartIcon,
  ReceiptTextIcon,
  TargetIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ContributionsOverview,
  MoneyOverview,
  ProjectsOverview,
  ReportsOverview,
} from "./types";

export function ReportMetricCards({
  contributions,
  currency,
  money,
  projects,
  reports,
}: {
  contributions: ContributionsOverview | null;
  currency: string;
  money: MoneyOverview | null;
  projects: ProjectsOverview | null;
  reports: ReportsOverview | null;
}) {
  const totals = reports?.totals;
  const cards = [
    {
      title: "Cash balance",
      value:
        totals?.cashBalanceMinorUnits ?? money?.totals?.cashBalanceMinorUnits,
      description: "Server-approved family position",
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: "Income",
      value: totals?.incomeMinorUnits ?? money?.totals?.incomeMinorUnits,
      description: "Approved money received",
      icon: ReceiptTextIcon,
      isMoney: true,
    },
    {
      title: "Expenses",
      value: totals?.expenseMinorUnits ?? money?.totals?.expenseMinorUnits,
      description: "Approved money spent",
      icon: PieChartIcon,
      isMoney: true,
    },
    {
      title: "Contributions",
      value:
        totals?.contributionsPaidMinorUnits ??
        money?.totals?.contributionsPaidMinorUnits ??
        contributions?.totals?.collectedMinorUnits,
      description: "Verified family commitments",
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: "Savings",
      value: totals?.savingsMinorUnits ?? money?.totals?.savingsMinorUnits,
      description: "Saved toward family goals",
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: "Debts",
      value:
        totals?.debtOutstandingMinorUnits ??
        money?.totals?.debtOutstandingMinorUnits,
      description: "Outstanding borrowed or lent money",
      icon: LandmarkIcon,
      isMoney: true,
    },
    {
      title: "Project budgets",
      value:
        totals?.projectPlannedMinorUnits ?? projects?.totals?.plannedMinorUnits,
      description: "Approved target amounts across projects",
      icon: FolderKanbanIcon,
      isMoney: true,
    },
    {
      title: "Generated reports",
      value:
        typeof totals?.reportCount === "number"
          ? totals.reportCount.toLocaleString()
          : typeof reports?.reports?.length === "number"
            ? reports.reports.length.toLocaleString()
            : "No records",
      description: "Reports returned by the API",
      icon: FileBarChartIcon,
    },
  ];

  return (
    <section
      aria-label="Family reports summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-xl">
                  {card.isMoney ? (
                    <CompactMoney
                      currency={currency}
                      emptyLabel="No records"
                      value={card.value}
                    />
                  ) : (
                    card.value
                  )}
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
