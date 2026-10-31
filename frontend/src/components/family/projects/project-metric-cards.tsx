import {
  CalendarClockIcon,
  HammerIcon,
  HandCoinsIcon,
  TargetIcon,
  UsersRoundIcon,
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
import type { ProjectsOverview } from "./types";

const t = createTranslator("FamilyProjects");
const tDashboard = createTranslator("FamilyDashboard");

export function ProjectMetricCards({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const totals = projects?.totals;
  const cards = [
    {
      title: t("plannedBudget"),
      value: totals?.plannedMinorUnits,
      description: t("plannedBudgetDesc"),
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: t("contributed"),
      value: totals?.contributedMinorUnits,
      description: t("contributedDesc"),
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: t("outstanding"),
      value: totals?.outstandingMinorUnits,
      description: t("outstandingDesc"),
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: t("activeProjects"),
      value:
        typeof totals?.activeProjectCount === "number"
          ? totals.activeProjectCount.toLocaleString()
          : tDashboard("noRecords"),
      description: t("activeProjectsDesc"),
      icon: HammerIcon,
    },
    {
      title: t("pastTargetDate"),
      value:
        typeof totals?.overdueProjectCount === "number"
          ? totals.overdueProjectCount.toLocaleString()
          : tDashboard("noRecords"),
      description: t("pastTargetDateDesc"),
      icon: CalendarClockIcon,
    },
    {
      title: t("contributors"),
      value:
        typeof totals?.contributorCount === "number"
          ? totals.contributorCount.toLocaleString()
          : tDashboard("noRecords"),
      description: t("contributorsDesc"),
      icon: UsersRoundIcon,
    },
  ];

  return (
    <section
      aria-label={t("projectsSummaryAria")}
      className="grid gap-4 grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
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
                      emptyLabel={tDashboard("noRecords")}
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
