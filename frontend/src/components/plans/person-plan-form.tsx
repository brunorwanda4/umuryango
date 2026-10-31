"use client";

import {
  CalendarCheckIcon,
  ChevronDownIcon,
  PlusIcon,
  SaveIcon,
  TargetIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import {
  type PersonPlan,
  type PersonPlanFormValues,
  personPlanFormSchema,
  toDateInput,
} from "./types-and-schemas";

const today = () => new Date().toISOString().slice(0, 10);

function defaults(
  plan: PersonPlan | null,
  initialType: PersonPlan["type"],
): PersonPlanFormValues {
  return {
    type: plan?.type ?? initialType,
    title: plan?.title ?? "",
    description: plan?.description ?? "",
    dueDate: toDateInput(plan?.dueDate ?? null) || today(),
    priority: plan?.priority ?? "MEDIUM",
    reminderAt: toDateInput(plan?.reminderAt ?? null),
    note: plan?.note ?? "",
    startDate: toDateInput(plan?.startDate ?? null) || today(),
    targetDate: toDateInput(plan?.targetDate ?? null),
    needsMoney: plan?.needsMoney ?? false,
    targetAmountMinorUnits: Number(plan?.targetAmountMinorUnits ?? 0),
    currentAmountMinorUnits: Number(plan?.currentAmountMinorUnits ?? 0),
    goalCategory: plan?.goalCategory ?? "",
    reminderFrequency: plan?.reminderFrequency ?? "",
    goalIcon: plan?.goalIcon ?? "",
    progressMethod: plan?.progressMethod ?? "MILESTONE",
  };
}

export function PersonPlanForm({
  editPlan,
  initialType,
  onOpenChange,
  onSuccess,
  open,
}: {
  editPlan: PersonPlan | null;
  initialType: PersonPlan["type"];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const t = createTranslator("PersonalPlans");
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    PersonPlanFormValues,
    PersonPlan
  >({
    schema: personPlanFormSchema,
    formOptions: { defaultValues: defaults(editPlan, initialType) },
    request: {
      method: editPlan ? "patch" : "post",
      url: editPlan
        ? `/personal-plans/${encodeURIComponent(editPlan.id)}`
        : "/personal-plans",
    },
    transform: (values) => ({
      type: values.type,
      title: values.title,
      description:
        values.type === "LONG_TERM_GOAL" ? values.description || null : null,
      dueDate:
        values.type === "TASK"
          ? new Date(values.dueDate as string).toISOString()
          : null,
      dueTime: null,
      priority: values.type === "TASK" ? values.priority : null,
      reminderAt: values.reminderAt
        ? new Date(values.reminderAt).toISOString()
        : null,
      note: values.note || null,
      startDate:
        values.type === "LONG_TERM_GOAL"
          ? new Date(values.startDate as string).toISOString()
          : null,
      targetDate:
        values.type === "LONG_TERM_GOAL"
          ? new Date(values.targetDate as string).toISOString()
          : null,
      needsMoney: values.type === "LONG_TERM_GOAL" && values.needsMoney,
      targetAmountMinorUnits: values.needsMoney
        ? String(values.targetAmountMinorUnits)
        : null,
      currentAmountMinorUnits: values.needsMoney
        ? String(values.currentAmountMinorUnits)
        : null,
      currency: "RWF",
      goalCategory: values.goalCategory || null,
      reminderFrequency: values.reminderFrequency || null,
      goalIcon: values.goalIcon || null,
      progressMethod: values.needsMoney ? values.progressMethod : "MILESTONE",
    }),
    onSuccessMessage: editPlan
      ? t("form.planUpdatedToast")
      : t("form.planAddedToast"),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  useEffect(() => {
    if (open) form.reset(defaults(editPlan, initialType));
  }, [editPlan, form, initialType, open]);

  const type = useWatch({ control: form.control, name: "type" });
  const needsMoney = useWatch({ control: form.control, name: "needsMoney" });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editPlan ? t("form.editPlan") : t("form.addPlan")}
          </DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>
        <form
          id="person-plan-form"
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!editPlan ? (
            <CommonFormField
              control={form.control}
              name="type"
              label={t("form.planType")}
              fieldType="custom"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={0}
                  value={String(field.value)}
                  onValueChange={(value) => value && field.onChange(value)}
                  className="grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="TASK">
                    <CalendarCheckIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />{" "}
                    {t("form.task")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="LONG_TERM_GOAL">
                    <TargetIcon aria-hidden="true" data-icon="inline-start" />{" "}
                    {t("form.longTermGoal")}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          ) : null}
          <CommonFormField
            control={form.control}
            name="title"
            label={type === "TASK" ? t("form.title") : t("form.goalTitle")}
            placeholder={
              type === "TASK"
                ? t("form.titleTaskPlaceholder")
                : t("form.titleGoalPlaceholder")
            }
            required
          />

          {type === "TASK" ? (
            <>
              <CommonFormField
                control={form.control}
                name="dueDate"
                label={t("form.dueDate")}
                fieldType="time"
                required
              />
              <CommonFormField
                control={form.control}
                name="priority"
                label={t("form.priority")}
                fieldType="select"
                selectOptions={[
                  { value: "LOW", label: t("form.low") },
                  { value: "MEDIUM", label: t("form.medium") },
                  { value: "HIGH", label: t("form.high") },
                ]}
                required
              />
              <CommonFormField
                control={form.control}
                name="reminderAt"
                label={t("form.reminder")}
                fieldType="date"
              />
              <CommonFormField
                control={form.control}
                name="note"
                label={t("form.note")}
                fieldType="textarea"
                placeholder={t("form.optionalDetails")}
              />
            </>
          ) : (
            <>
              <CommonFormField
                control={form.control}
                name="description"
                label={t("form.descriptionLabel")}
                fieldType="textarea"
                placeholder={t("form.descriptionPlaceholder")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="startDate"
                  label={t("form.startDate")}
                  fieldType="date"
                  required
                />
                <CommonFormField
                  control={form.control}
                  name="targetDate"
                  label={t("form.targetDate")}
                  fieldType="date"
                  inputProps={{ min: form.watch("startDate") }}
                  required
                />
              </div>
              <CommonFormField
                control={form.control}
                name="needsMoney"
                label={t("form.needsMoney")}
                fieldType="custom"
                fieldClassName="rounded-2xl border p-4"
                render={({ field, id }) => (
                  <Switch
                    id={id}
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              {needsMoney ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CommonFormField
                    control={form.control}
                    name="targetAmountMinorUnits"
                    label={t("form.targetAmount")}
                    fieldType="money"
                    currency="RWF"
                    required
                  />
                  <CommonFormField
                    control={form.control}
                    name="currentAmountMinorUnits"
                    label={t("form.currentAmount")}
                    fieldType="money"
                    currency="RWF"
                  />
                </div>
              ) : null}
              <CommonFormField
                control={form.control}
                name="note"
                label={t("form.note")}
                fieldType="textarea"
                placeholder={t("form.optionalDetails")}
              />
              <Collapsible
                open={additionalOpen}
                onOpenChange={setAdditionalOpen}
                className="flex flex-col gap-4"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {t("form.additionalDetails")}
                    <ChevronDownIcon
                      aria-hidden="true"
                      data-icon="inline-end"
                      className={
                        additionalOpen
                          ? "rotate-180 transition-transform"
                          : "transition-transform"
                      }
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CommonFormField
                    control={form.control}
                    name="goalCategory"
                    label={t("form.goalCategory")}
                    placeholder={t("form.goalCategoryPlaceholder")}
                  />
                  <CommonFormField
                    control={form.control}
                    name="reminderFrequency"
                    label={t("form.reminderFrequency")}
                    fieldType="select"
                    placeholder={t("form.noRecurringReminder")}
                    selectOptions={[
                      { value: "WEEKLY", label: t("form.weekly") },
                      { value: "MONTHLY", label: t("form.monthly") },
                      { value: "QUARTERLY", label: t("form.quarterly") },
                    ]}
                  />
                  <CommonFormField
                    control={form.control}
                    name="goalIcon"
                    label={t("form.goalIcon")}
                    fieldType="lucide-icon"
                    placeholder={t("form.chooseIcon")}
                  />
                  <CommonFormField
                    control={form.control}
                    name="progressMethod"
                    label={t("form.progressCalculation")}
                    fieldType="select"
                    selectOptions={[
                      { value: "MILESTONE", label: t("form.milestones") },
                      {
                        value: "FINANCIAL",
                        label: t("form.financialProgress"),
                        disabled: !needsMoney,
                      },
                    ]}
                  />
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="person-plan-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {editPlan ? (
              <SaveIcon aria-hidden="true" data-icon="inline-start" />
            ) : (
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
            )}
            {isPending
              ? t("form.saving")
              : editPlan
                ? t("form.saveChanges")
                : t("form.submitAdd")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
