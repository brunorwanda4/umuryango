import {
  BellIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  Edit3Icon,
  EyeIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import {
  isOverdue,
  type PersonPlan,
  type PersonPlanStatus,
} from "./types-and-schemas";

function formatDate(value: string | null, noDateLabel: string) {
  if (!value) return noDateLabel;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: string | null, currency: string) {
  const amount = Number(BigInt(value ?? "0"));
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "RWF" ? 0 : 2,
  }).format(amount / (currency === "RWF" ? 1 : 100));
}

function StatusBadge({ plan }: { plan: PersonPlan }) {
  const t = createTranslator("PersonalPlans");
  const label = isOverdue(plan)
    ? t((m) => m.PersonalPlans.items.overdue)
    : plan.status === "COMPLETED"
      ? t((m) => m.PersonalPlans.filters.completed)
      : plan.status === "IN_PROGRESS"
        ? t((m) => m.PersonalPlans.filters.inProgress)
        : plan.status === "CANCELLED"
          ? t((m) => m.PersonalPlans.filters.cancelled)
          : t((m) => m.PersonalPlans.filters.pending);

  return (
    <Badge variant={plan.status === "COMPLETED" ? "default" : "secondary"}>
      {label}
    </Badge>
  );
}

function PlanActions({
  plan,
  onDelete,
  onEdit,
  onStatus,
  onView,
}: PlanItemProps) {
  const t = createTranslator("PersonalPlans");
  const completed = plan.status === "COMPLETED";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={t((m) => m.PersonalPlans.items.actionsFor, {
            title: plan.title,
          })}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onView(plan)}>
            <EyeIcon aria-hidden="true" />{" "}
            {t((m) => m.PersonalPlans.items.view)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(plan)}>
            <Edit3Icon aria-hidden="true" />{" "}
            {t((m) => m.PersonalPlans.items.edit)}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onStatus(plan, completed ? "PENDING" : "COMPLETED")}
          >
            {completed ? (
              <RotateCcwIcon aria-hidden="true" />
            ) : (
              <CheckCircle2Icon aria-hidden="true" />
            )}
            {completed
              ? t((m) => m.PersonalPlans.items.markIncomplete)
              : t((m) => m.PersonalPlans.items.markComplete)}
          </DropdownMenuItem>
          {plan.type === "TASK" ? (
            <DropdownMenuItem onSelect={() => onEdit(plan)}>
              <CalendarClockIcon aria-hidden="true" />{" "}
              {t((m) => m.PersonalPlans.items.reschedule)}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(plan)}
          >
            <Trash2Icon aria-hidden="true" />{" "}
            {t((m) => m.PersonalPlans.items.delete)}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PlanItemProps = {
  plan: PersonPlan;
  onDelete: (plan: PersonPlan) => void;
  onEdit: (plan: PersonPlan) => void;
  onStatus: (plan: PersonPlan, status: PersonPlanStatus) => void;
  onView: (plan: PersonPlan) => void;
};

export function PersonTaskItem(props: PlanItemProps) {
  const t = createTranslator("PersonalPlans");
  const { plan, onStatus } = props;
  const completed = plan.status === "COMPLETED";

  const priorityLabel = plan.priority
    ? plan.priority === "LOW"
      ? t((m) => m.PersonalPlans.items.low)
      : plan.priority === "MEDIUM"
        ? t((m) => m.PersonalPlans.items.medium)
        : t((m) => m.PersonalPlans.items.high)
    : t((m) => m.PersonalPlans.items.noPriority);

  return (
    <Item
      asChild
      variant="outline"
      className={cn("items-start", completed && "bg-muted/40 opacity-75")}
    >
      <li>
        <ItemMedia>
          <Checkbox
            aria-label={
              completed
                ? t((m) => m.PersonalPlans.items.markTitleIncomplete, {
                    title: plan.title,
                  })
                : t((m) => m.PersonalPlans.items.markTitleComplete, {
                    title: plan.title,
                  })
            }
            checked={completed}
            onCheckedChange={(checked) =>
              onStatus(plan, checked ? "COMPLETED" : "PENDING")
            }
          />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle
            className={cn("line-clamp-2", completed && "line-through")}
          >
            {plan.title}
          </ItemTitle>
          <ItemDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDaysIcon aria-hidden="true" />
              {formatDate(
                plan.dueDate,
                t((m) => m.PersonalPlans.items.noDate),
              )}
            </span>
            {plan.dueTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock3Icon aria-hidden="true" />
                {plan.dueTime}
              </span>
            ) : null}
            {plan.reminderAt ? (
              <span className="inline-flex items-center gap-1">
                <BellIcon aria-hidden="true" />
                {t((m) => m.PersonalPlans.items.reminderSet)}
              </span>
            ) : null}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="ml-auto">
          <Badge variant="outline">{priorityLabel}</Badge>
          <StatusBadge plan={plan} />
          <PlanActions {...props} />
        </ItemActions>
      </li>
    </Item>
  );
}

export function PersonGoalItem(props: PlanItemProps) {
  const t = createTranslator("PersonalPlans");
  const { plan } = props;
  const completedMilestones = plan.milestones.filter(
    (item) => item.completedAt,
  ).length;
  const current = BigInt(plan.currentAmountMinorUnits ?? "0");
  const target = BigInt(plan.targetAmountMinorUnits ?? "0");
  const remaining = target > current ? target - current : BigInt(0);

  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        "items-start",
        plan.status === "COMPLETED" && "bg-muted/40 opacity-75",
      )}
    >
      <li>
        <ItemMedia variant="icon" className="rounded-full bg-muted p-2">
          <TargetIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent className="min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ItemTitle className="line-clamp-2">{plan.title}</ItemTitle>
            <StatusBadge plan={plan} />
          </div>
          {plan.description ? (
            <ItemDescription>{plan.description}</ItemDescription>
          ) : null}
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t((m) => m.PersonalPlans.items.targetDate, {
                date: formatDate(
                  plan.targetDate,
                  t((m) => m.PersonalPlans.items.noDate),
                ),
              })}
            </span>
            <span>
              {t((m) => m.PersonalPlans.items.completedPercent, {
                progress: plan.progress,
              })}
            </span>
          </div>
          <Progress
            value={plan.progress}
            aria-label={t((m) => m.PersonalPlans.items.progressAria, {
              title: plan.title,
            })}
          />
        </ItemContent>
        <ItemActions className="ml-auto">
          <PlanActions {...props} />
        </ItemActions>
        <ItemFooter className="flex-wrap text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {completedMilestones ? (
              <CheckCircle2Icon aria-hidden="true" />
            ) : (
              <CircleIcon aria-hidden="true" />
            )}
            {t((m) => m.PersonalPlans.items.milestonesProgress, {
              completed: completedMilestones,
              total: plan.milestones.length,
            })}
          </span>
          {plan.needsMoney ? (
            <span>
              {t((m) => m.PersonalPlans.items.financialProgress, {
                current: formatMoney(
                  plan.currentAmountMinorUnits,
                  plan.currency,
                ),
                target: formatMoney(plan.targetAmountMinorUnits, plan.currency),
                remaining: formatMoney(remaining.toString(), plan.currency),
              })}
            </span>
          ) : null}
        </ItemFooter>
      </li>
    </Item>
  );
}
