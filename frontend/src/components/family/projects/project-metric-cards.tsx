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
import type { ProjectsOverview } from "./types";

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
      title: "Planned budget",
      value: totals?.plannedMinorUnits,
      description: "Approved target amounts across projects",
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: "Contributed",
      value: totals?.contributedMinorUnits,
      description: "Verified project contributions received",
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: "Outstanding",
      value: totals?.outstandingMinorUnits,
      description: "Remaining amount needed for open plans",
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: "Active projects",
      value:
        typeof totals?.activeProjectCount === "number"
          ? totals.activeProjectCount.toLocaleString()
          : "No records",
      description: "Projects currently being worked on",
      icon: HammerIcon,
    },
    {
      title: "Past target date",
      value:
        typeof totals?.overdueProjectCount === "number"
          ? totals.overdueProjectCount.toLocaleString()
          : "No records",
      description: "Projects that need review or a new date",
      icon: CalendarClockIcon,
    },
    {
      title: "Contributors",
      value:
        typeof totals?.contributorCount === "number"
          ? totals.contributorCount.toLocaleString()
          : "No records",
      description: "Members who contributed to projects",
      icon: UsersRoundIcon,
    },
  ];

  return (
    <section
      aria-label="Family projects summary"
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
