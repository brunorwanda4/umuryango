import { Badge } from "@/components/ui/badge";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import { joinedDateFormatter } from "./dashboard-data";
import type { FamilyDetail } from "./types";

export function FamilyDashboardHeader({ family }: { family: FamilyDetail }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              {family.name}
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground text-sm leading-6">
            {family.description ??
              "A simple place for the family to manage members, money, events, projects, announcements, documents, and reports."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Badge variant="outline">{family.country}</Badge>
          <Badge variant="outline">{family.defaultCurrency}</Badge>
          <Badge variant="outline">{family.contributionCadence}</Badge>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Created {joinedDateFormatter.format(new Date(family.createdAt))}
      </p>
    </header>
  );
}
