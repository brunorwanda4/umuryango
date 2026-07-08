import { CalendarIcon, CoinsIcon, GlobeIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import {
  formatRelativeTime,
  getLatestFamilyActivityDate,
  joinedDateFormatter,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

export function FamilyDashboardHeader({ family }: { family: FamilyDetail }) {
  const latestActivityDate = getLatestFamilyActivityDate(family);

  return (
    <header className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Welcome to {family.name}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {AUTHORITY_LABELS[family.authority]}
          </Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm leading-6">
          {family.description ??
            "A simple place for the family to manage members, money, events, projects, announcements, documents, and reports."}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            {latestActivityDate
              ? `Last active ${formatRelativeTime(latestActivityDate)}`
              : "Activity pending"}
          </Badge>
          <Badge variant="outline">
            Created {joinedDateFormatter.format(new Date(family.createdAt))}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm">
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon className="size-3.5" aria-hidden="true" />
            {family.memberCount}{" "}
            {family.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GlobeIcon className="size-3.5" aria-hidden="true" />
            {family.country}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CoinsIcon className="size-3.5" aria-hidden="true" />
            {family.defaultCurrency}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            {family.contributionCadence}
          </span>
        </div>
      </div>
    </header>
  );
}
