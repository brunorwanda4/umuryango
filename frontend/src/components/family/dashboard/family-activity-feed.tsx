import {
  ActivityIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FolderKanbanIcon,
  PiggyBankIcon,
  SettingsIcon,
  UserCheckIcon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react";
import {
  DashboardActivityItem,
  DashboardActivityList,
} from "@/components/common/dashboard/dashboard-activity-list";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import type { MoneyOverview } from "@/components/family/money/types";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import {
  buildFamilyActivityEntries,
  formatRelativeTime,
} from "./dashboard-data";
import type {
  ContributionsOverview,
  FamilyActivityEntry,
  FamilyAuditEvent,
  FamilyDetail,
} from "./types";

const t = createTranslator("FamilyDashboard");

function getActivityIcon(kind: FamilyActivityEntry["kind"]) {
  switch (kind) {
    case "transaction-income":
      return <ArrowDownLeftIcon className="size-4" aria-hidden="true" />;
    case "transaction-expense":
      return <ArrowUpRightIcon className="size-4" aria-hidden="true" />;
    case "transaction-approved":
      return <CheckCircle2Icon className="size-4" aria-hidden="true" />;
    case "transaction-rejected":
      return <XCircleIcon className="size-4" aria-hidden="true" />;
    case "contribution":
      return <PiggyBankIcon className="size-4" aria-hidden="true" />;
    case "project":
      return <FolderKanbanIcon className="size-4" aria-hidden="true" />;
    case "member-invited":
      return <UserPlusIcon className="size-4" aria-hidden="true" />;
    case "member-joined":
    case "member-updated":
      return <UserCheckIcon className="size-4" aria-hidden="true" />;
    case "settings":
      return <SettingsIcon className="size-4" aria-hidden="true" />;
  }
}

export function FamilyActivityFeed({
  family,
  money,
  contributions = null,
  projects = null,
  auditEvents = null,
  className,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  contributions?: ContributionsOverview | null;
  projects?: ProjectsOverview | null;
  auditEvents?: FamilyAuditEvent[] | null;
  className?: string;
}) {
  const canViewAuditLog = hasCapability(family, "MANAGE_MEMBERS");
  const encodedSlug = encodeURIComponent(family.slug);
  const entries = buildFamilyActivityEntries({
    family,
    money,
    contributions,
    projects,
    auditEvents,
  });

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.recentActivityTitle)}
      description={t((m) => m.FamilyDashboard.recentActivityDesc)}
      actionHref={
        canViewAuditLog ? `/family/${encodedSlug}/settings/audit` : undefined
      }
      actionLabel={
        canViewAuditLog ? t((m) => m.FamilyDashboard.viewAuditLog) : undefined
      }
      className={className}
    >
      {entries.length === 0 ? (
        <DashboardEmptyState
          icon={<ActivityIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noActivityTitle)}
          description={t((m) => m.FamilyDashboard.noActivityDesc)}
        />
      ) : (
        <DashboardActivityList>
          {entries.map((entry) => {
            const parsedDate = new Date(entry.occurredAt);
            const timestamp = Number.isNaN(parsedDate.getTime())
              ? entry.occurredAt
              : formatRelativeTime(parsedDate);

            return (
              <DashboardActivityItem
                key={entry.id}
                href={entry.href}
                icon={getActivityIcon(entry.kind)}
                title={entry.title}
                description={entry.detail}
                timestamp={timestamp}
              />
            );
          })}
        </DashboardActivityList>
      )}
    </DashboardSectionCard>
  );
}
