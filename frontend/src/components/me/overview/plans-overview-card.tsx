import { CalendarDaysIcon } from "lucide-react";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardStatTile } from "@/components/common/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import type { PersonPlan } from "@/components/plans/types-and-schemas";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createTranslator, type Translator } from "@/i18n/translate";

export function PlansOverviewCard({ plans }: { plans: PersonPlan[] }) {
  const t = createTranslator("PersonalOverview.plansCard");
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
      label: t((m) => m.PersonalOverview.plansCard.dueToday),
      value: plans.filter(
        (plan) =>
          plan.dueDate?.slice(0, 10) === today && plan.status !== "COMPLETED",
      ).length,
    },
    {
      label: t((m) => m.PersonalOverview.plansCard.dueThisWeek),
      value: plans.filter((plan) => {
        const date = plan.dueDate ? new Date(plan.dueDate) : null;
        return (
          date && date >= now && date <= weekEnd && plan.status !== "COMPLETED"
        );
      }).length,
    },
    {
      label: t((m) => m.PersonalOverview.plansCard.longTermGoals),
      value: plans.filter(
        (plan) =>
          plan.type === "LONG_TERM_GOAL" &&
          plan.status !== "COMPLETED" &&
          plan.status !== "CANCELLED",
      ).length,
    },
    {
      label: t((m) => m.PersonalOverview.plansCard.completed),
      value: plans.filter((plan) => plan.status === "COMPLETED").length,
    },
  ];

  return (
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.plansCard.title)}
      description={t((m) => m.PersonalOverview.plansCard.description)}
      actionHref="/me/plans"
      actionLabel={t((m) => m.PersonalOverview.plansCard.viewAll)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {stats.map((stat) => (
          <DashboardStatTile
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>
      {plans.length === 0 ? (
        <DashboardEmptyState
          icon={<CalendarDaysIcon aria-hidden="true" />}
          title={t((m) => m.PersonalOverview.plansCard.noPlansYet)}
          description={t((m) => m.PersonalOverview.plansCard.noPlansYetDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-xs text-foreground">
            {t((m) => m.PersonalOverview.plansCard.upcoming)}
          </p>
          <div className="space-y-2">
            {upcoming.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {plan.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-mono"
                  >
                    {plan.type === "TASK"
                      ? t((m) => m.PersonalOverview.plansCard.task)
                      : `${plan.progress}%`}
                  </Badge>
                </div>
                {plan.type !== "TASK" ? (
                  <Progress value={plan.progress} className="h-1.5 w-full" />
                ) : null}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{formatPlanDate(plan, t)}</span>
                  <span className="capitalize">
                    {plan.type.toLowerCase().replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardSectionCard>
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

function formatPlanDate(plan: PersonPlan, t: Translator) {
  const value = plan.dueDate ?? plan.targetDate;
  if (!value) return t((m) => m.PersonalOverview.plansCard.noDateSet);
  const date = new Date(value);
  const today = toLocalDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value.slice(0, 10) === today)
    return t((m) => m.PersonalOverview.plansCard.today);
  if (value.slice(0, 10) === toLocalDate(tomorrow))
    return t((m) => m.PersonalOverview.plansCard.tomorrow);
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}
