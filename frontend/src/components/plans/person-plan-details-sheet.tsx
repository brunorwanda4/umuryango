"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import {
  isOverdue,
  type PersonPlan,
  type PersonPlanMilestone,
} from "./types-and-schemas";

function date(value: string | null, notSetLabel: string) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : notSetLabel;
}

function money(value: string | null, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "RWF" ? 0 : 2,
  }).format(Number(BigInt(value ?? "0")) / (currency === "RWF" ? 1 : 100));
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function PersonPlanDetailsSheet({
  onOpenChange,
  onUpdated,
  plan,
}: {
  onOpenChange: (open: boolean) => void;
  onUpdated: (planId: string) => void;
  plan: PersonPlan | null;
}) {
  const t = createTranslator("PersonalPlans");
  const [newMilestone, setNewMilestone] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [pending, setPending] = useState(false);

  const request = async (
    method: "post" | "patch" | "delete",
    path: string,
    body?: unknown,
  ) => {
    if (!plan || pending) return false;
    setPending(true);
    const response = await apiRequest(method, path, body);
    setPending(false);
    if (!response.ok) {
      toast.error(t("details.milestoneUpdateError"), {
        description: response.message,
      });
      return false;
    }
    onUpdated(plan.id);
    return true;
  };

  const addMilestone = async () => {
    const title = newMilestone.trim();
    if (title.length < 2 || !plan) return;
    if (
      await request(
        "post",
        `/personal-plans/${encodeURIComponent(plan.id)}/milestones`,
        { title },
      )
    ) {
      setNewMilestone("");
      toast.success(t("details.milestoneAdded"));
    }
  };

  const updateMilestone = async (
    milestone: PersonPlanMilestone,
    body: { title?: string; completed?: boolean },
  ) => {
    if (!plan) return;
    if (
      await request(
        "patch",
        `/personal-plans/${encodeURIComponent(plan.id)}/milestones/${encodeURIComponent(milestone.id)}`,
        body,
      )
    ) {
      setEditing(null);
    }
  };

  const reorder = async (index: number, direction: -1 | 1) => {
    if (!plan) return;
    const target = index + direction;
    if (target < 0 || target >= plan.milestones.length) return;
    const orderedIds = plan.milestones.map((item) => item.id);
    [orderedIds[index], orderedIds[target]] = [
      orderedIds[target],
      orderedIds[index],
    ];
    await request(
      "patch",
      `/personal-plans/${encodeURIComponent(plan.id)}/milestones`,
      { orderedIds },
    );
  };

  if (!plan) return null;
  const target = BigInt(plan.targetAmountMinorUnits ?? "0");
  const current = BigInt(plan.currentAmountMinorUnits ?? "0");
  const remaining = target > current ? target - current : BigInt(0);

  const statusLabel = isOverdue(plan)
    ? t("items.overdue")
    : plan.status === "COMPLETED"
      ? t("filters.completed")
      : plan.status === "IN_PROGRESS"
        ? t("filters.inProgress")
        : plan.status === "CANCELLED"
          ? t("filters.cancelled")
          : t("filters.pending");

  const priorityLabel = plan.priority
    ? plan.priority === "LOW"
      ? t("items.low")
      : plan.priority === "MEDIUM"
        ? t("items.medium")
        : t("items.high")
    : null;

  return (
    <Sheet open onOpenChange={onOpenChange} syncWithSearchParams={false}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{plan.title}</SheetTitle>
          <SheetDescription>
            {plan.type === "TASK"
              ? t("details.taskDetails")
              : t("details.goalDetails")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{statusLabel}</Badge>
            {priorityLabel ? (
              <Badge variant="outline">{priorityLabel}</Badge>
            ) : null}
          </div>
          {plan.description ? (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          ) : null}
          <dl className="grid grid-cols-2 gap-4">
            {plan.type === "TASK" ? (
              <>
                <Detail
                  label={t("details.dueDate")}
                  value={date(plan.dueDate, t("details.notSet"))}
                />
                <Detail
                  label={t("details.time")}
                  value={plan.dueTime || t("details.notSet")}
                />
                <Detail
                  label={t("details.reminder")}
                  value={date(plan.reminderAt, t("details.notSet"))}
                />
              </>
            ) : (
              <>
                <Detail
                  label={t("details.startDate")}
                  value={date(plan.startDate, t("details.notSet"))}
                />
                <Detail
                  label={t("details.targetDate")}
                  value={date(plan.targetDate, t("details.notSet"))}
                />
              </>
            )}
            <Detail
              label={t("details.created")}
              value={date(plan.createdAt, t("details.notSet"))}
            />
            {plan.completedAt ? (
              <Detail
                label={t("details.completed")}
                value={date(plan.completedAt, t("details.notSet"))}
              />
            ) : null}
          </dl>
          {plan.note ? (
            <>
              <Separator />
              <Detail label={t("details.notes")} value={plan.note} />
            </>
          ) : null}
          {plan.type === "LONG_TERM_GOAL" ? (
            <>
              <Separator />
              <section
                className="flex flex-col gap-3"
                aria-labelledby="goal-progress-heading"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 id="goal-progress-heading" className="font-semibold">
                    {t("details.progress")}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {plan.progress}%
                  </span>
                </div>
                <Progress value={plan.progress} />
                {plan.needsMoney ? (
                  <dl className="grid grid-cols-3 gap-3">
                    <Detail
                      label={t("details.target")}
                      value={money(plan.targetAmountMinorUnits, plan.currency)}
                    />
                    <Detail
                      label={t("details.current")}
                      value={money(plan.currentAmountMinorUnits, plan.currency)}
                    />
                    <Detail
                      label={t("details.remaining")}
                      value={money(remaining.toString(), plan.currency)}
                    />
                  </dl>
                ) : null}
              </section>
              <Separator />
              <section
                className="flex flex-col gap-3"
                aria-labelledby="milestones-heading"
              >
                <div>
                  <h3 id="milestones-heading" className="font-semibold">
                    {t("details.milestones")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("details.milestonesCompleted", {
                      completed: plan.milestones.filter(
                        (item) => item.completedAt,
                      ).length,
                      total: plan.milestones.length,
                    })}
                  </p>
                </div>
                <form
                  className="flex items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addMilestone();
                  }}
                >
                  <Field>
                    <FieldLabel htmlFor="new-milestone">
                      {t("details.addMilestone")}
                    </FieldLabel>
                    <Input
                      id="new-milestone"
                      value={newMilestone}
                      onChange={(event) => setNewMilestone(event.target.value)}
                      placeholder={t("details.milestonePlaceholder")}
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={pending || newMilestone.trim().length < 2}
                    aria-label={t("details.addMilestoneAria")}
                  >
                    <PlusIcon aria-hidden="true" />
                  </Button>
                </form>
                <ItemGroup>
                  {plan.milestones.map((milestone, index) => (
                    <Item key={milestone.id} size="sm" variant="outline">
                      <Checkbox
                        checked={Boolean(milestone.completedAt)}
                        aria-label={t("details.markMilestoneAria", {
                          title: milestone.title,
                          status: milestone.completedAt
                            ? t("items.markIncomplete")
                            : t("items.markComplete"),
                        })}
                        onCheckedChange={(checked) =>
                          void updateMilestone(milestone, {
                            completed: Boolean(checked),
                          })
                        }
                      />
                      <ItemContent>
                        {editing === milestone.id ? (
                          <Input
                            value={editTitle}
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            aria-label={t("details.milestoneTitleAria")}
                          />
                        ) : (
                          <ItemTitle
                            className={
                              milestone.completedAt ? "line-through" : undefined
                            }
                          >
                            {milestone.title}
                          </ItemTitle>
                        )}
                      </ItemContent>
                      <ItemActions>
                        {editing === milestone.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.saveMilestoneAria")}
                              disabled={editTitle.trim().length < 2}
                              onClick={() =>
                                void updateMilestone(milestone, {
                                  title: editTitle.trim(),
                                })
                              }
                            >
                              <CheckIcon />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.cancelEditingAria")}
                              onClick={() => setEditing(null)}
                            >
                              <XIcon />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.moveMilestoneUpAria")}
                              disabled={index === 0 || pending}
                              onClick={() => void reorder(index, -1)}
                            >
                              <ArrowUpIcon />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.moveMilestoneDownAria")}
                              disabled={
                                index === plan.milestones.length - 1 || pending
                              }
                              onClick={() => void reorder(index, 1)}
                            >
                              <ArrowDownIcon />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.editMilestoneAria")}
                              onClick={() => {
                                setEditing(milestone.id);
                                setEditTitle(milestone.title);
                              }}
                            >
                              <PencilIcon />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("details.deleteMilestoneAria")}
                              onClick={() =>
                                void request(
                                  "delete",
                                  `/personal-plans/${encodeURIComponent(plan.id)}/milestones/${encodeURIComponent(milestone.id)}`,
                                )
                              }
                            >
                              <Trash2Icon />
                            </Button>
                          </>
                        )}
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              </section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
