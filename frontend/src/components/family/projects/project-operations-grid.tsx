import {
  CalendarClockIcon,
  CheckCircle2Icon,
  FolderKanbanIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasCapability } from "@/lib/family-access";
import type { ProjectsOverview } from "./types";

export function ProjectOperationsGrid({
  family,
  projects,
}: {
  family: FamilyDetail;
  projects: ProjectsOverview | null;
}) {
  const items = [
    {
      title: "Family members",
      description: "People available to assign to project work.",
      value: family.memberCount.toLocaleString(),
      icon: UsersRoundIcon,
    },
    {
      title: "Report source",
      description: "Reports must come from persisted project records.",
      value: `${projects?.sourceRecordCount ?? 0} records`,
      icon: CheckCircle2Icon,
    },
    {
      title: "Contribution cadence",
      description: "Default family cadence for planned collections.",
      value: family.contributionCadence,
      icon: CalendarClockIcon,
    },
    {
      title: "Project permission",
      description: "Backend must enforce manage-project actions.",
      value: hasCapability(family, "MANAGE_PROJECTS") ? "Allowed" : "View only",
      icon: FolderKanbanIcon,
    },
  ];

  return (
    <section
      aria-label="Project operations"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl tracking-tight">
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
