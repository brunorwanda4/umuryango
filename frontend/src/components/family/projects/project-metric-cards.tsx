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
      title: t((m) => m.FamilyProjects.plannedBudget),
      value: totals?.plannedMinorUnits,
      description: t((m) => m.FamilyProjects.plannedBudgetDesc),
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.contributed),
      value: totals?.contributedMinorUnits,
      description: t((m) => m.FamilyProjects.contributedDesc),
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.outstanding),
      value: totals?.outstandingMinorUnits,
      description: t((m) => m.FamilyProjects.outstandingDesc),
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.activeProjects),
      value:
        typeof totals?.activeProjectCount === "number"
          ? totals.activeProjectCount.toLocaleString()
          : tDashboard((m) => m.FamilyDashboard.noRecords),
      description: t((m) => m.FamilyProjects.activeProjectsDesc),
      icon: HammerIcon,
    },
    {
      title: t((m) => m.FamilyProjects.pastTargetDate),
      value:
        typeof totals?.overdueProjectCount === "number"
          ? totals.overdueProjectCount.toLocaleString()
          : tDashboard((m) => m.FamilyDashboard.noRecords),
      description: t((m) => m.FamilyProjects.pastTargetDateDesc),
      icon: CalendarClockIcon,
    },
    {
      title: t((m) => m.FamilyProjects.contributors),
      value:
        typeof totals?.contributorCount === "number"
          ? totals.contributorCount.toLocaleString()
          : tDashboard((m) => m.FamilyDashboard.noRecords),
      description: t((m) => m.FamilyProjects.contributorsDesc),
      icon: UsersRoundIcon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyProjects.projectsSummaryAria)}
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
                      emptyLabel={tDashboard(
                        (m) => m.FamilyDashboard.noRecords,
                      )}
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
