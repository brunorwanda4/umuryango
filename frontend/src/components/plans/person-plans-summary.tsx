import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
} from "lucide-react";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import type { PersonPlan } from "./types-and-schemas";

function sameDay(date: string | null, value: Date) {
  return (
    Boolean(date) &&
    new Date(date as string).toDateString() === value.toDateString()
  );
}

export function PersonPlansSummary({ plans }: { plans: PersonPlan[] }) {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (7 - now.getDay()));
  const activeTasks = plans.filter(
    (plan) =>
      plan.type === "TASK" &&
      plan.status !== "COMPLETED" &&
      plan.status !== "CANCELLED",
  );

  return (
    <CommonOverviewCardDisplay
      className="grid-cols-2 gap-3 xl:grid-cols-4"
      cardHeaderClassName=" items-start"
      cardDescriptionClassName="font-medium"
      cardTitleClassName="text-2xl"
      iconPosition="start"
      cards={[
        {
          description: "Due today",
          value: activeTasks.filter((plan) => sameDay(plan.dueDate, now))
            .length,
          iconImage: "/images/icons/today.png"
        },
        {
          description: "This week",
          value: activeTasks.filter((plan) => {
            const due = plan.dueDate ? new Date(plan.dueDate) : null;
            return due && due >= new Date(now.toDateString()) && due <= weekEnd;
          }).length,
          iconImage: "/images/icons/week.png"
        },
        {
          description: "In progress",
          value: plans.filter((plan) => plan.status === "IN_PROGRESS").length,
          iconImage: "/images/icons/rise.png",

        },
        {
          description: "Completed",
          value: plans.filter((plan) => plan.status === "COMPLETED").length,
          iconImage: "/images/icons/approved.png",

        },
      ]}
    />
  );
}
