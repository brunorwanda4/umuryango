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
import { formatOptionalMoney } from "./utils";

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
      value: formatOptionalMoney(
        totals?.cashBalanceMinorUnits ?? money?.totals?.cashBalanceMinorUnits,
        currency,
      ),
      description: "Server-approved family position",
      icon: WalletCardsIcon,
    },
    {
      title: "Income",
      value: formatOptionalMoney(
        totals?.incomeMinorUnits ?? money?.totals?.incomeMinorUnits,
        currency,
      ),
      description: "Approved money received",
      icon: ReceiptTextIcon,
    },
    {
      title: "Expenses",
      value: formatOptionalMoney(
        totals?.expenseMinorUnits ?? money?.totals?.expenseMinorUnits,
        currency,
      ),
      description: "Approved money spent",
      icon: PieChartIcon,
    },
    {
      title: "Contributions",
      value: formatOptionalMoney(
        totals?.contributionsPaidMinorUnits ??
          money?.totals?.contributionsPaidMinorUnits ??
          contributions?.totals?.collectedMinorUnits,
        currency,
      ),
      description: "Verified family commitments",
      icon: HandCoinsIcon,
    },
    {
      title: "Savings",
      value: formatOptionalMoney(
        totals?.savingsMinorUnits ?? money?.totals?.savingsMinorUnits,
        currency,
      ),
      description: "Saved toward family goals",
      icon: TargetIcon,
    },
    {
      title: "Debts",
      value: formatOptionalMoney(
        totals?.debtOutstandingMinorUnits ??
          money?.totals?.debtOutstandingMinorUnits,
        currency,
      ),
      description: "Outstanding borrowed or lent money",
      icon: LandmarkIcon,
    },
    {
      title: "Project budgets",
      value: formatOptionalMoney(
        totals?.projectPlannedMinorUnits ?? projects?.totals?.plannedMinorUnits,
        currency,
      ),
      description: "Approved target amounts across projects",
      icon: FolderKanbanIcon,
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
                  {card.value}
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
