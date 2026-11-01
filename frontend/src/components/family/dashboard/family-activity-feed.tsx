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
import { cn } from "@/lib/utils";
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

function getActivityIconMeta(kind: FamilyActivityEntry["kind"]) {
  switch (kind) {
    case "transaction-income":
      return {
        icon: <ArrowDownLeftIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    case "transaction-expense":
      return {
        icon: <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      };
    case "transaction-approved":
      return {
        icon: <CheckCircle2Icon className="size-3.5" aria-hidden="true" />,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    case "transaction-rejected":
      return {
        icon: (
          <XCircleIcon
            className="size-3.5 text-destructive"
            aria-hidden="true"
          />
        ),
        className: "bg-destructive/10",
      };
    case "contribution":
      return {
        icon: <PiggyBankIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      };
    case "project":
      return {
        icon: <FolderKanbanIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      };
    case "member-invited":
      return {
        icon: <UserPlusIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-primary/10 text-primary",
      };
    case "member-joined":
    case "member-updated":
      return {
        icon: <UserCheckIcon className="size-3.5" aria-hidden="true" />,
        className: "bg-primary/10 text-primary",
      };
    case "settings":
      return {
        icon: (
          <SettingsIcon
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        ),
        className: "bg-muted",
      };
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
            const meta = getActivityIconMeta(entry.kind);

            return (
              <DashboardActivityItem
                key={entry.id}
                href={entry.href}
                icon={
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      meta.className,
                    )}
                  >
                    {meta.icon}
                  </div>
                }
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
