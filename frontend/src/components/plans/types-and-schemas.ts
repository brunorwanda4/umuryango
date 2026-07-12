import { z } from "zod";

export type PersonPlanType = "TASK" | "LONG_TERM_GOAL";
export type PersonPlanStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type PersonPlanPriority = "LOW" | "MEDIUM" | "HIGH";
export type GoalProgressMethod = "MILESTONE" | "FINANCIAL";

export type PlanPerson = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  relationship: string;
};

export type PersonPlanMilestone = {
  id: string;
  title: string;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonPlan = {
  id: string;
  personId: string;
  type: PersonPlanType;
  title: string;
  description: string | null;
  status: PersonPlanStatus;
  priority: PersonPlanPriority | null;
  startDate: string | null;
  dueDate: string | null;
  dueTime: string | null;
  targetDate: string | null;
  reminderAt: string | null;
  reminderFrequency: string | null;
  note: string | null;
  goalCategory: string | null;
  goalIcon: string | null;
  needsMoney: boolean;
  targetAmountMinorUnits: string | null;
  currentAmountMinorUnits: string | null;
  currency: string;
  progressMethod: GoalProgressMethod;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  milestones: PersonPlanMilestone[];
};

export type PersonalPlansResponse = {
  person: PlanPerson;
  plans: PersonPlan[];
};

export type PlanFilters = {
  search: string;
  type: "all" | PersonPlanType;
  status: "all" | PersonPlanStatus | "OVERDUE";
  priority: "all" | PersonPlanPriority;
  date: string;
};

export const EMPTY_PLAN_FILTERS: PlanFilters = {
  search: "",
  type: "all",
  status: "all",
  priority: "all",
  date: "",
};

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const personPlanFormSchema = z
  .object({
    type: z.enum(["TASK", "LONG_TERM_GOAL"]),
    title: z.string().trim().min(2, "Enter a title.").max(120),
    description: optionalText(1000),
    dueDate: z.string().optional(),
    dueTime: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    reminderAt: z.string().optional(),
    note: optionalText(2000),
    startDate: z.string().optional(),
    targetDate: z.string().optional(),
    needsMoney: z.boolean(),
    targetAmountMinorUnits: z.number().int().nonnegative(),
    currentAmountMinorUnits: z.number().int().nonnegative(),
    goalCategory: optionalText(60),
    reminderFrequency: optionalText(40),
    goalIcon: optionalText(40),
    progressMethod: z.enum(["MILESTONE", "FINANCIAL"]),
  })
  .superRefine((values, context) => {
    if (values.type === "TASK" && !values.dueDate) {
      context.addIssue({
        code: "custom",
        message: "Choose a due date.",
        path: ["dueDate"],
      });
    }
    if (values.type === "LONG_TERM_GOAL" && !values.targetDate) {
      context.addIssue({
        code: "custom",
        message: "Choose a target date.",
        path: ["targetDate"],
      });
    }
    if (
      values.startDate &&
      values.targetDate &&
      values.targetDate < values.startDate
    ) {
      context.addIssue({
        code: "custom",
        message: "Target date must be after the start date.",
        path: ["targetDate"],
      });
    }
    if (values.needsMoney && values.targetAmountMinorUnits <= 0) {
      context.addIssue({
        code: "custom",
        message: "Enter a target amount.",
        path: ["targetAmountMinorUnits"],
      });
    }
  });

export type PersonPlanFormValues = z.infer<typeof personPlanFormSchema>;

export function isOverdue(plan: PersonPlan, now = new Date()) {
  return (
    plan.type === "TASK" &&
    Boolean(plan.dueDate) &&
    new Date(plan.dueDate as string) < new Date(now.toDateString()) &&
    plan.status !== "COMPLETED" &&
    plan.status !== "CANCELLED"
  );
}

export function formatPlanStatus(plan: PersonPlan) {
  if (isOverdue(plan)) return "Overdue";
  return plan.status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
}

export function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}
