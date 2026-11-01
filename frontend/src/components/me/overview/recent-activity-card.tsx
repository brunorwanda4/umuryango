import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  UsersIcon,
} from "lucide-react";
import {
  DashboardActivityItem,
  DashboardActivityList,
} from "@/components/common/dashboard/dashboard-activity-list";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { createTranslator, type Translator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { PersonalOverviewData } from "./personal-overview-data";

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export function RecentActivityCard({ data }: { data: PersonalOverviewData }) {
  const t = createTranslator("PersonalOverview.recentActivityCard");
  const activities: Activity[] = [
    ...(data.income?.records ?? []).map((record) => ({
      id: `income-${record.id}`,
      title: t((m) => m.PersonalOverview.recentActivityCard.addedIncome),
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ArrowDownLeftIcon,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    })),
    ...(data.expenses?.records ?? []).map((record) => ({
      id: `expense-${record.id}`,
      title: t((m) => m.PersonalOverview.recentActivityCard.addedExpense),
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ArrowUpRightIcon,
      iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    })),
    ...data.plans.map((plan) => ({
      id: `plan-${plan.id}`,
      title:
        plan.status === "COMPLETED"
          ? t((m) => m.PersonalOverview.recentActivityCard.completedPlan)
          : t((m) => m.PersonalOverview.recentActivityCard.createdPlan),
      description: plan.title,
      time: plan.completedAt ?? plan.createdAt,
      icon: CalendarCheckIcon,
      iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    })),
    ...data.families.map((family) => ({
      id: `family-${family.id}`,
      title: t(
        (m) => m.PersonalOverview.recentActivityCard.familyWorkspaceAvailable,
      ),
      description: family.name,
      time: "",
      icon: UsersIcon,
      iconClassName: "bg-muted text-muted-foreground",
    })),
  ]
    .sort(
      (a, b) =>
        (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0),
    )
    .slice(0, 5);

  return (
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.recentActivityCard.title)}
      description={t(
        (m) => m.PersonalOverview.recentActivityCard.recentActionsDesc,
      )}
    >
      {activities.length === 0 ? (
        <DashboardEmptyState
          icon={<ActivityIcon aria-hidden="true" />}
          title={t((m) => m.PersonalOverview.recentActivityCard.emptyTitle)}
          description={t(
            (m) => m.PersonalOverview.recentActivityCard.noRecentActions,
          )}
        />
      ) : (
        <DashboardActivityList>
          {activities.map((activity) => (
            <DashboardActivityItem
              key={activity.id}
              icon={
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    activity.iconClassName,
                  )}
                >
                  <activity.icon className="size-3.5" aria-hidden="true" />
                </div>
              }
              title={activity.title}
              description={activity.description}
              timestamp={
                activity.time
                  ? formatRelativeTime(activity.time, t)
                  : t((m) => m.PersonalOverview.recentActivityCard.availableNow)
              }
            />
          ))}
        </DashboardActivityList>
      )}
    </DashboardSectionCard>
  );
}

function formatRelativeTime(value: string, t: Translator) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 1000),
  );
  if (seconds < 60)
    return t((m) => m.PersonalOverview.recentActivityCard.justNow);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return t((m) => m.PersonalOverview.recentActivityCard.minutesAgo, {
      minutes,
    });
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return t((m) => m.PersonalOverview.recentActivityCard.hoursAgo, { hours });
  const days = Math.floor(hours / 24);
  if (days < 7)
    return t((m) => m.PersonalOverview.recentActivityCard.daysAgo, { days });
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
