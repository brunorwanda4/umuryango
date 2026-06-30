import { ReceiptTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableEmptyState } from "./projects-ui-helpers";
import type { ProjectsOverview } from "./types";
import { formatDate } from "./utils";

export function ProjectUpdatesList({
  projects,
}: {
  projects: ProjectsOverview | null;
}) {
  const updates = projects?.updates ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project updates</CardTitle>
        <CardDescription>
          Milestones, notes, and changes recorded against family projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {updates.length ? (
          updates.map((update) => (
            <article key={update.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{update.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {update.projectName}
                    {update.createdBy ? ` by ${update.createdBy}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{formatDate(update.createdAt)}</Badge>
              </div>
              {update.body ? (
                <p className="mt-3 text-muted-foreground text-sm leading-6">
                  {update.body}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <TableEmptyState
            description="Project milestones, documents, and progress notes will appear here."
            icon={ReceiptTextIcon}
            title="No project updates returned"
          />
        )}
      </CardContent>
    </Card>
  );
}
