import { FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";
import {
  ProjectFact,
  StatusBadge,
  TableEmptyState,
} from "./projects-ui-helpers";
import type { ProjectsOverview } from "./types";
import {
  clampPercent,
  createProjectSlug,
  formatDate,
  formatTitle,
} from "./utils";

const t = createTranslator("FamilyProjects");
const tDashboard = createTranslator("FamilyDashboard");

export function ProjectList({
  currency,
  familyName,
  projects,
}: {
  currency: string;
  familyName: string;
  projects: ProjectsOverview | null;
}) {
  const rows = projects?.projects ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t((m) => m.FamilyProjects.projectPlansTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyProjects.projectPlansDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length ? (
          rows.map((project) => (
            <article key={project.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-base">
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/family/${encodeURIComponent(familyName)}/projects/${createProjectSlug(
                          project.name,
                        )}`}
                      >
                        {project.name}
                      </Link>
                    </h2>
                    <StatusBadge value={project.status ?? "planned"} />
                    {project.category ? (
                      <Badge variant="outline">
                        {formatTitle(project.category)}
                      </Badge>
                    ) : null}
                  </div>
                  {project.description ? (
                    <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                      {project.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge variant="secondary">
                    {project.ownerName ??
                      t((m) => m.FamilyProjects.noOwnerAssigned)}
                  </Badge>
                  <Badge variant="outline">
                    {typeof project.memberCount === "number"
                      ? tDashboard((m) => m.FamilyDashboard.membersCount, {
                          count: project.memberCount,
                        })
                      : t((m) => m.FamilyProjects.membersNotSet)}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <ProjectFact
                  label={t((m) => m.FamilyProjects.targetAmount)}
                  value={
                    <CompactMoney
                      currency={currency}
                      emptyLabel={tDashboard(
                        (m) => m.FamilyDashboard.noRecords,
                      )}
                      value={project.targetAmountMinorUnits}
                    />
                  }
                />
                <ProjectFact
                  label={t((m) => m.FamilyProjects.contributed)}
                  value={
                    <CompactMoney
                      currency={currency}
                      emptyLabel={tDashboard(
                        (m) => m.FamilyDashboard.noRecords,
                      )}
                      value={project.contributedMinorUnits}
                    />
                  }
                />
                <ProjectFact
                  label={t((m) => m.FamilyProjects.targetDate)}
                  value={formatDate(project.targetDate)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(project.percentFunded)} />
                <p className="text-muted-foreground text-xs">
                  {typeof project.percentFunded === "number"
                    ? t((m) => m.FamilyProjects.percentFunded, {
                        percent: Math.round(
                          clampPercent(project.percentFunded),
                        ),
                      })
                    : t((m) => m.FamilyProjects.fundingPercentMissing)}
                  {project.contributionStrategy
                    ? ` ${t((m) => m.FamilyProjects.contributionPlan, {
                        strategy: formatTitle(project.contributionStrategy),
                      })}`
                    : ""}
                </p>
              </div>
            </article>
          ))
        ) : (
          <TableEmptyState
            description={t((m) => m.FamilyProjects.noProjectPlansDesc)}
            icon={FolderKanbanIcon}
            title={t((m) => m.FamilyProjects.noProjectPlansTitle)}
          />
        )}
      </CardContent>
    </Card>
  );
}
