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
import type { PersonalOverviewData } from "./personal-overview-data";

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
};

export function RecentActivityCard({ data }: { data: PersonalOverviewData }) {
  const activities: Activity[] = [
    ...(data.income?.records ?? []).map((record) => ({
      id: `income-${record.id}`,
      title: "Added income",
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ReceiptTextIcon,
    })),
    ...(data.expenses?.records ?? []).map((record) => ({
      id: `expense-${record.id}`,
      title: "Added expense",
      description: record.description ?? record.category.name,
      time: record.createdAt,
      icon: ReceiptTextIcon,
    })),
    ...data.plans.map((plan) => ({
      id: `plan-${plan.id}`,
      title:
        plan.status === "COMPLETED" ? "Completed a plan" : "Created a plan",
      description: plan.title,
      time: plan.completedAt ?? plan.createdAt,
      icon: CalendarCheckIcon,
    })),
    ...data.families.map((family) => ({
      id: `family-${family.id}`,
      title: "Family workspace available",
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
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Your latest personal and family actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ActivityIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No recent activity</EmptyTitle>
              <EmptyDescription>
                Your recent actions will appear here.
              </EmptyDescription>
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
                    ? formatRelativeTime(activity.time)
                    : "Available now"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 1000),
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
