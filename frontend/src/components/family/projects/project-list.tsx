import { FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  formatOptionalMoney,
  formatTitle,
} from "./utils";

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
        <CardTitle>Project plans</CardTitle>
        <CardDescription>
          Family goals with budgets, dates, owners, members, and contribution
          progress.
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
                    {project.ownerName ?? "No owner assigned"}
                  </Badge>
                  <Badge variant="outline">
                    {typeof project.memberCount === "number"
                      ? `${project.memberCount.toLocaleString()} members`
                      : "Members not set"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <ProjectFact
                  label="Target amount"
                  value={formatOptionalMoney(
                    project.targetAmountMinorUnits,
                    currency,
                  )}
                />
                <ProjectFact
                  label="Contributed"
                  value={formatOptionalMoney(
                    project.contributedMinorUnits,
                    currency,
                  )}
                />
                <ProjectFact
                  label="Target date"
                  value={formatDate(project.targetDate)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(project.percentFunded)} />
                <p className="text-muted-foreground text-xs">
                  {typeof project.percentFunded === "number"
                    ? `${Math.round(clampPercent(project.percentFunded))}% funded`
                    : "Funding percent must come from persisted records."}
                  {project.contributionStrategy
                    ? ` Contribution plan: ${formatTitle(project.contributionStrategy)}.`
                    : ""}
                </p>
              </div>
            </article>
          ))
        ) : (
          <TableEmptyState
            description="Saved plans such as buying a vehicle, building a house, education support, and family business projects will appear here."
            icon={FolderKanbanIcon}
            title="No project plans returned"
          />
        )}
      </CardContent>
    </Card>
  );
}
