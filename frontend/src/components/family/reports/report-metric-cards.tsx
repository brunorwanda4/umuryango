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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyReports");
  const totals = reports?.totals;
  const cards = [
    {
      title: t((m) => m.FamilyReports.cashBalanceTitle),
      value:
        totals?.cashBalanceMinorUnits ?? money?.totals?.cashBalanceMinorUnits,
      description: t((m) => m.FamilyReports.cashBalanceDesc),
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.incomeTitle),
      value: totals?.incomeMinorUnits ?? money?.totals?.incomeMinorUnits,
      description: t((m) => m.FamilyReports.incomeDesc),
      icon: ReceiptTextIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.expensesTitle),
      value: totals?.expenseMinorUnits ?? money?.totals?.expenseMinorUnits,
      description: t((m) => m.FamilyReports.expensesDesc),
      icon: PieChartIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.contributionsTitle),
      value:
        totals?.contributionsPaidMinorUnits ??
        money?.totals?.contributionsPaidMinorUnits ??
        contributions?.totals?.collectedMinorUnits,
      description: t((m) => m.FamilyReports.contributionsDesc),
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.savingsTitle),
      value: totals?.savingsMinorUnits ?? money?.totals?.savingsMinorUnits,
      description: t((m) => m.FamilyReports.savingsDesc),
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.debtsTitle),
      value:
        totals?.debtOutstandingMinorUnits ??
        money?.totals?.debtOutstandingMinorUnits,
      description: t((m) => m.FamilyReports.debtsDesc),
      icon: LandmarkIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.projectBudgetsTitle),
      value:
        totals?.projectPlannedMinorUnits ?? projects?.totals?.plannedMinorUnits,
      description: t((m) => m.FamilyReports.projectBudgetsDesc),
      icon: FolderKanbanIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyReports.generatedReportsTitle),
      value:
        typeof totals?.reportCount === "number"
          ? totals.reportCount.toLocaleString()
          : typeof reports?.reports?.length === "number"
            ? reports.reports.length.toLocaleString()
            : t((m) => m.FamilyReports.noSourceRecords),
      description: t((m) => m.FamilyReports.generatedReportsDesc),
      icon: FileBarChartIcon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyReports.reportsSummaryAria)}
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
