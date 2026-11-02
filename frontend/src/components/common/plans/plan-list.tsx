import type { ReactNode } from "react";
import { PlanCardItem } from "./plan-card-item";
import { PlanEmptyState } from "./plan-empty-state";
import type { SharedPlanItem } from "./types";

export function PlanList({
  items,
  hasPlans,
  onAdd,
  onResetFilters,
  isPersonal = true,
  emptySlot,
}: {
  items: SharedPlanItem[];
  hasPlans: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
  isPersonal?: boolean;
  emptySlot?: ReactNode;
}) {
  if (items.length === 0) {
    return (
      <PlanEmptyState
        hasPlans={hasPlans}
        onAdd={onAdd}
        onResetFilters={onResetFilters}
        isPersonal={isPersonal}
        customSlot={emptySlot}
      />
    );
  }

  // Separate tasks and goals for clear visual grouping if both are present
  const goals = items.filter((item) => !item.taskCheckable);
  const tasks = items.filter((item) => item.taskCheckable);

  return (
    <div className="flex flex-col gap-4">
      {/* Goals & Projects Cards */}
      {goals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {goals.map((item) => (
            <PlanCardItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}

      {/* Actionable Tasks */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {goals.length > 0 ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              Tasks & Milestones ({tasks.length})
            </span>
          ) : null}
          <div className="flex flex-col gap-2">
            {tasks.map((item) => (
              <PlanCardItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
