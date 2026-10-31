import { CalendarOffIcon, PlusIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ItemGroup } from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import {
  PersonGoalItem,
  PersonTaskItem,
  type PlanItemProps,
} from "./person-plan-item";
import type { PersonPlan, PlanPerson } from "./types-and-schemas";

type PlansTab = "today" | "week" | "month" | "long-term" | "completed";

function plansForTab(plans: PersonPlan[], tab: PlansTab, now = new Date()) {
  const dayStart = new Date(now.toDateString());
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - dayStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (tab === "completed")
    return plans.filter((plan) => plan.status === "COMPLETED");
  if (tab === "long-term") {
    return plans.filter(
      (plan) => plan.type === "LONG_TERM_GOAL" && plan.status !== "COMPLETED",
    );
  }
  return plans.filter((plan) => {
    if (plan.type !== "TASK" || plan.status === "COMPLETED") return false;
    const due = plan.dueDate ? new Date(plan.dueDate) : null;
    if (!due) return false;
    if (tab === "today") return due.toDateString() === now.toDateString();
    if (tab === "week") return due >= weekStart && due < weekEnd;
    return due >= monthStart && due < monthEnd;
  });
}

function TabEmpty({
  onAdd,
  person,
  tab,
}: {
  onAdd: (type?: PersonPlan["type"]) => void;
  person: PlanPerson;
  tab: PlansTab;
}) {
  const t = createTranslator("PersonalPlans");
  const firstName = person.fullName.split(" ")[0] || person.fullName;
  const isGoal = tab === "long-term";
  const periodLabel =
    tab === "week"
      ? t("tabs.thisWeekPeriod")
      : tab === "month"
        ? t("tabs.thisMonthPeriod")
        : t("tabs.completedPeriod");

  return (
    <Empty className="min-h-64 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isGoal ? (
            <TargetIcon aria-hidden="true" />
          ) : (
            <CalendarOffIcon aria-hidden="true" />
          )}
        </EmptyMedia>
        <EmptyTitle>
          {tab === "today"
            ? t("tabs.nothingPlannedToday")
            : isGoal
              ? t("tabs.noLongTermGoals")
              : t("tabs.noPlansIn", { period: periodLabel })}
        </EmptyTitle>
        <EmptyDescription>
          {tab === "today"
            ? t("tabs.noTasksTodayFor", { name: firstName })
            : isGoal
              ? t("tabs.createFutureGoalFor", { name: firstName })
              : tab === "completed"
                ? t("tabs.noCompletedPlans")
                : t("tabs.noTasksScheduled")}
        </EmptyDescription>
      </EmptyHeader>
      {tab !== "completed" ? (
        <EmptyContent>
          <Button onClick={() => onAdd(isGoal ? "LONG_TERM_GOAL" : "TASK")}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            {isGoal ? t("tabs.createGoal") : t("tabs.addPlan")}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function PersonPlansTabs({
  itemActions,
  onAdd,
  person,
  plans,
}: {
  itemActions: Omit<PlanItemProps, "plan">;
  onAdd: (type?: PersonPlan["type"]) => void;
  person: PlanPerson;
  plans: PersonPlan[];
}) {
  const t = createTranslator("PersonalPlans");
  const tabs: Array<{ value: PlansTab; label: string }> = [
    { value: "today", label: t("tabs.today") },
    { value: "week", label: t("tabs.week") },
    { value: "month", label: t("tabs.month") },
    { value: "long-term", label: t("tabs.longTerm") },
    { value: "completed", label: t("tabs.completed") },
  ];

  return (
    <Tabs defaultValue="today">
      <div className="overflow-x-auto pb-1">
        <TabsList className="w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => {
        const tabPlans = plansForTab(plans, tab.value);
        return (
          <TabsContent key={tab.value} value={tab.value} className="pt-2">
            {tabPlans.length ? (
              <ItemGroup>
                {tabPlans.map((plan) =>
                  plan.type === "TASK" ? (
                    <PersonTaskItem
                      key={plan.id}
                      plan={plan}
                      {...itemActions}
                    />
                  ) : (
                    <PersonGoalItem
                      key={plan.id}
                      plan={plan}
                      {...itemActions}
                    />
                  ),
                )}
              </ItemGroup>
            ) : (
              <TabEmpty person={person} tab={tab.value} onAdd={onAdd} />
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
