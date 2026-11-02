import {
  formatTargetTimeline,
  getCategoryEmoji,
} from "@/components/common/plans/plan-calculations";
import type {
  SharedPlanAction,
  SharedPlanItem,
} from "@/components/common/plans/types";
import {
  isOverdue,
  type PersonPlan,
  type PersonPlanStatus,
} from "./types-and-schemas";

export type PersonPlanAdapterActions = {
  onEdit: (plan: PersonPlan) => void;
  onDelete: (plan: PersonPlan) => void;
  onStatus: (plan: PersonPlan, status: PersonPlanStatus) => void;
  onView: (plan: PersonPlan) => void;
};

export function adaptPersonPlanToSharedItem(
  plan: PersonPlan,
  actions: PersonPlanAdapterActions,
): SharedPlanItem {
  const isTask = plan.type === "TASK";
  const overdue = isOverdue(plan);
  const isCompleted = plan.status === "COMPLETED";

  const targetDate = isTask ? plan.dueDate : plan.targetDate;
  const targetTimeline = formatTargetTimeline(targetDate, isCompleted);
  const targetDateLabel = targetTimeline.label;

  const category = plan.goalCategory || (isTask ? "Task" : "Goal");
  const iconEmoji = getCategoryEmoji(category, plan.title, plan.goalIcon);

  // Financial values
  const hasTarget = Boolean(
    plan.needsMoney &&
      plan.targetAmountMinorUnits &&
      BigInt(plan.targetAmountMinorUnits) > BigInt(0),
  );
  const targetMinor =
    hasTarget && plan.targetAmountMinorUnits
      ? BigInt(plan.targetAmountMinorUnits)
      : null;
  const currentMinor = plan.needsMoney
    ? BigInt(plan.currentAmountMinorUnits || "0")
    : null;

  let remainingMinorStr: string | null = null;
  if (targetMinor !== null && currentMinor !== null) {
    const diff = targetMinor - currentMinor;
    remainingMinorStr = (diff > BigInt(0) ? diff : BigInt(0)).toString();
  }

  // Progress percent
  let progressPercent = plan.progress || 0;
  if (targetMinor && targetMinor > BigInt(0) && currentMinor !== null) {
    const calculated = Number((currentMinor * BigInt(100)) / targetMinor);
    progressPercent = Math.min(100, Math.max(0, calculated));
  } else if (isCompleted) {
    progressPercent = 100;
  }

  // Status label
  let statusLabel = "Active";
  if (isCompleted) {
    statusLabel = "Completed";
  } else if (overdue) {
    statusLabel = "Overdue";
  } else if (plan.status === "IN_PROGRESS") {
    statusLabel = "In Progress";
  } else if (plan.status === "CANCELLED") {
    statusLabel = "Cancelled";
  } else if (plan.status === "PENDING") {
    statusLabel = "Pending";
  }

  const statusVariant = isCompleted
    ? "secondary"
    : overdue
      ? "destructive"
      : plan.status === "CANCELLED"
        ? "outline"
        : "default";

  // Milestones count
  const completedMilestones =
    plan.milestones?.filter((m) => Boolean(m.completedAt)).length || 0;
  const totalMilestones = plan.milestones?.length || 0;
  const milestonesCount =
    totalMilestones > 0
      ? { completed: completedMilestones, total: totalMilestones }
      : null;

  // Menu actions
  const menuActions: SharedPlanAction[] = [
    {
      label: "View details",
      onClick: () => actions.onView(plan),
    },
    {
      label: "Edit plan",
      onClick: () => actions.onEdit(plan),
    },
  ];

  if (!isCompleted) {
    menuActions.push({
      label: "Mark completed",
      onClick: () => actions.onStatus(plan, "COMPLETED"),
    });
  } else {
    menuActions.push({
      label: "Mark incomplete",
      onClick: () => actions.onStatus(plan, "IN_PROGRESS"),
    });
  }

  menuActions.push({
    label: "Delete",
    destructive: true,
    onClick: () => actions.onDelete(plan),
  });

  // Primary action button
  let primaryAction: SharedPlanAction | undefined;
  if (!isCompleted && hasTarget) {
    primaryAction = {
      label: "+ Save",
      onClick: () => actions.onView(plan),
    };
  }

  const isFinancial = Boolean(plan.needsMoney && hasTarget);

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    category,
    iconEmoji,
    status: overdue ? "OVERDUE" : plan.status,
    statusLabel,
    statusVariant,
    isOverdue: overdue,
    isCompleted,
    isFinancial,
    targetAmountMinorUnits: plan.targetAmountMinorUnits,
    currentAmountMinorUnits:
      plan.currentAmountMinorUnits || (hasTarget ? "0" : null),
    remainingAmountMinorUnits: remainingMinorStr,
    currency: plan.currency || "RWF",
    progressPercent,
    targetDate,
    targetDateLabel,
    ownerOrSubtitle: isTask ? "Task" : category,
    milestonesCount,
    primaryAction,
    menuActions,
    onCardClick: () => actions.onView(plan),
    taskCheckable: isTask
      ? {
          checked: isCompleted,
          onToggle: () =>
            actions.onStatus(plan, isCompleted ? "IN_PROGRESS" : "COMPLETED"),
        }
      : undefined,
  };
}
