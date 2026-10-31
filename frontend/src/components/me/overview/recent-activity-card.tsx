import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator, type Translator } from "@/i18n/translate";
import type { PersonalOverviewData } from "./personal-overview-data";

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
};

export function RecentActivityCard({ data }: { data: PersonalOverviewData }) {
  const t = createTranslator("PersonalOverview.recentActivityCard");
  const activities: Activity[] = [
    ...(data.income?.records ?? []).map((record) => ({
      id: `income-${record.id}`,
      title: t("addedIncome"),
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ReceiptTextIcon,
    })),
    ...(data.expenses?.records ?? []).map((record) => ({
      id: `expense-${record.id}`,
      title: t("addedExpense"),
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ReceiptTextIcon,
    })),
    ...data.plans.map((plan) => ({
      id: `plan-${plan.id}`,
      title:
        plan.status === "COMPLETED" ? t("completedPlan") : t("createdPlan"),
      description: plan.title,
      time: plan.completedAt ?? plan.createdAt,
      icon: CalendarCheckIcon,
    })),
    ...data.families.map((family) => ({
      id: `family-${family.id}`,
      title: t("familyWorkspaceAvailable"),
      description: family.name,
      time: "",
      icon: UsersIcon,
    })),
  ]
    .sort(
      (a, b) =>
        (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0),
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("recentActionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ActivityIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("noRecentActions")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <activity.icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {activity.description}
                  </p>
                </div>
                <p className="shrink-0 text-muted-foreground text-xs">
                  {activity.time
                    ? formatRelativeTime(activity.time, t)
                    : t("availableNow")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(value: string, t: Translator) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 1000),
  );
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("daysAgo", { days });
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
