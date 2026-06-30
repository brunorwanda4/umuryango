import { DownloadIcon } from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { CreateProjectDialog } from "@/components/family/projects/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AUTHORITY_LABELS } from "@/lib/family-access";

export function ProjectsHeader({
  canExportReports,
  canManageProjects,
  currency,
  family,
  hasSourceRecords,
  onProjectCreated,
}: {
  canExportReports: boolean;
  canManageProjects: boolean;
  currency: string;
  family: FamilyDetail;
  hasSourceRecords: boolean;
  onProjectCreated: () => void;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Family projects
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Plan family goals such as building a house, buying a vehicle,
            funding education, or starting a business. Budgets, members,
            contribution progress, dates, and updates are shown from persisted
            project records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canManageProjects ? (
            <CreateProjectDialog
              currency={currency}
              family={family}
              onProjectCreated={onProjectCreated}
            />
          ) : null}
          {canExportReports ? (
            <Button size="sm" variant="outline">
              <DownloadIcon aria-hidden="true" data-icon="inline-start" />
              Export
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.name}</Badge>
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{currency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}
