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
import { cn } from "@/lib/utils";
import {
  formatPlanStatus,
  type PersonPlan,
  type PersonPlanStatus,
} from "./types-and-schemas";

function formatDate(value: string | null) {
  if (!value) return "No date";
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
  return (
    <Badge variant={plan.status === "COMPLETED" ? "default" : "secondary"}>
      {formatPlanStatus(plan)}
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
  const completed = plan.status === "COMPLETED";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Actions for ${plan.title}`}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onView(plan)}>
            <EyeIcon aria-hidden="true" /> View
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(plan)}>
            <Edit3Icon aria-hidden="true" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onStatus(plan, completed ? "PENDING" : "COMPLETED")}
          >
            {completed ? (
              <RotateCcwIcon aria-hidden="true" />
            ) : (
              <CheckCircle2Icon aria-hidden="true" />
            )}
            Mark {completed ? "incomplete" : "complete"}
          </DropdownMenuItem>
          {plan.type === "TASK" ? (
            <DropdownMenuItem onSelect={() => onEdit(plan)}>
              <CalendarClockIcon aria-hidden="true" /> Reschedule
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(plan)}
          >
            <Trash2Icon aria-hidden="true" /> Delete
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
  const { plan, onStatus } = props;
  const completed = plan.status === "COMPLETED";
  return (
    <Item
      asChild
      variant="outline"
      className={cn("items-start", completed && "bg-muted/40 opacity-75")}
    >
      <li>
        <ItemMedia>
          <Checkbox
            aria-label={`Mark ${plan.title} ${completed ? "incomplete" : "complete"}`}
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
              {formatDate(plan.dueDate)}
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
                Reminder set
              </span>
            ) : null}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="ml-auto">
          <Badge variant="outline">
            {plan.priority
              ? `${plan.priority[0]}${plan.priority.slice(1).toLowerCase()}`
              : "No priority"}
          </Badge>
          <StatusBadge plan={plan} />
          <PlanActions {...props} />
        </ItemActions>
      </li>
    </Item>
  );
}

export function PersonGoalItem(props: PlanItemProps) {
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
            <span>Target {formatDate(plan.targetDate)}</span>
            <span>{plan.progress}% completed</span>
          </div>
          <Progress
            value={plan.progress}
            aria-label={`${plan.title} progress`}
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
            {completedMilestones} of {plan.milestones.length} milestones
          </span>
          {plan.needsMoney ? (
            <span>
              {formatMoney(plan.currentAmountMinorUnits, plan.currency)} of{" "}
              {formatMoney(plan.targetAmountMinorUnits, plan.currency)} /{" "}
              {formatMoney(remaining.toString(), plan.currency)} remaining
            </span>
          ) : null}
        </ItemFooter>
      </li>
    </Item>
  );
}
