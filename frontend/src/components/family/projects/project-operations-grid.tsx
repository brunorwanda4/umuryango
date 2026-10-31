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
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import type { ProjectsOverview } from "./types";

const t = createTranslator("FamilyProjects");
const tDashboard = createTranslator("FamilyDashboard");

export function ProjectOperationsGrid({
  family,
  projects,
}: {
  family: FamilyDetail;
  projects: ProjectsOverview | null;
}) {
  const items = [
    {
      title: tDashboard((m) => m.FamilyDashboard.familyMembers),
      description: t((m) => m.FamilyProjects.availableMembersDesc),
      value: family.memberCount.toLocaleString(),
      icon: UsersRoundIcon,
    },
    {
      title: t((m) => m.FamilyProjects.reportSourceTitle),
      description: t((m) => m.FamilyProjects.reportSourceDesc),
      value: t((m) => m.FamilyProjects.sourceRecordCount, {
        count: projects?.sourceRecordCount ?? 0,
      }),
      icon: CheckCircle2Icon,
    },
    {
      title: t((m) => m.FamilyProjects.contributionCadenceTitle),
      description: t((m) => m.FamilyProjects.contributionCadenceDesc),
      value: family.contributionCadence,
      icon: CalendarClockIcon,
    },
    {
      title: t((m) => m.FamilyProjects.projectPermissionTitle),
      description: t((m) => m.FamilyProjects.projectPermissionDesc),
      value: hasCapability(family, "MANAGE_PROJECTS")
        ? t((m) => m.FamilyProjects.permissionAllowed)
        : t((m) => m.FamilyProjects.permissionViewOnly),
      icon: FolderKanbanIcon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyProjects.operationsAria)}
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
