import { ArrowRightIcon, CalendarDaysIcon } from "lucide-react";
import Link from "next/link";
import type { PersonPlan } from "@/components/plans/types-and-schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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

export function PlansOverviewCard({ plans }: { plans: PersonPlan[] }) {
  const now = new Date();
  const today = toLocalDate(now);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const upcoming = plans
    .filter(
      (plan) => plan.status !== "COMPLETED" && plan.status !== "CANCELLED",
    )
    .sort((a, b) => getPlanTime(a) - getPlanTime(b))
    .slice(0, 3);
  const stats = [
    {
      label: "Due today",
      value: plans.filter(
        (plan) =>
          plan.dueDate?.slice(0, 10) === today && plan.status !== "COMPLETED",
      ).length,
    },
    {
      label: "Due this week",
      value: plans.filter((plan) => {
        const date = plan.dueDate ? new Date(plan.dueDate) : null;
        return (
          date && date >= now && date <= weekEnd && plan.status !== "COMPLETED"
        );
      }).length,
    },
    {
      label: "Long-term goals",
      value: plans.filter(
        (plan) =>
          plan.type === "LONG_TERM_GOAL" &&
          plan.status !== "COMPLETED" &&
          plan.status !== "CANCELLED",
      ).length,
    },
    {
      label: "Completed",
      value: plans.filter((plan) => plan.status === "COMPLETED").length,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans overview</CardTitle>
        <CardDescription>Upcoming tasks and longer-term goals.</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/me/plans">
              View all
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted p-3">
              <p className="font-semibold text-xl">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
        {plans.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No plans yet</EmptyTitle>
              <EmptyDescription>
                Create your first plan to track important tasks and goals.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">Upcoming</p>
            {upcoming.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{plan.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatPlanDate(plan)}
                  </p>
                </div>
                <Badge variant="outline">
                  {plan.type === "TASK" ? "Task" : `${plan.progress}%`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getPlanTime(plan: PersonPlan) {
  const value = plan.dueDate ?? plan.targetDate;
  return value ? Date.parse(value) : Number.MAX_SAFE_INTEGER;
}

function toLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPlanDate(plan: PersonPlan) {
  const value = plan.dueDate ?? plan.targetDate;
  if (!value) return "No date set";
  const date = new Date(value);
  const today = toLocalDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value.slice(0, 10) === today) return "Today";
  if (value.slice(0, 10) === toLocalDate(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}
