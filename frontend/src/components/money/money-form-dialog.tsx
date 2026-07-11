"use client";

import { FolderPlusIcon, PencilIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { cn } from "@/lib/utils";

type MoneyFormType = "income" | "expense" | "savings" | "debt";

export type MoneyFormCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export type MoneyFormValues = {
  account: string;
  amountMinorUnits: number;
  categoryId: string;
  date: string;
  notes: string;
  title: string;
};

interface MoneyFormDialogProps {
  categories?: MoneyFormCategory[];
  defaultValues?: Partial<MoneyFormValues>;
  familyId?: string;
  incomeId?: string;
  mode?: "create" | "update";
  onCategoryCreated?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
  open?: boolean;
  trigger?: React.ReactElement | null;
  triggerClassName?: string;
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  type: MoneyFormType;
}

const moneyFormSchema = z.object({
  account: z.string().min(1, "Account is required"),
  amountMinorUnits: z.coerce
    .number()
    .int("Amount must be a whole number")
    .positive("Amount must be greater than zero")
    .max(999_999_999_999_999, "Amount is too large"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000, "Notes are too long"),
  title: z
    .string()
    .trim()
    .min(1, "Source is required")
    .max(180, "Source is too long"),
});

const formConfig: Record<
  MoneyFormType,
  {
    action: string;
    description: string;
    title: string;
    transactionType?: "INCOME" | "EXPENSE";
    updateAction: string;
    updateDescription: string;
    updateTitle: string;
  }
> = {
  debt: {
    action: "Add debt",
    description: "Track borrowed or lent money.",
    title: "Add Debt",
    updateAction: "Update debt",
    updateDescription: "Update this debt record.",
    updateTitle: "Update Debt",
  },
  expense: {
    action: "Add expense",
    description: "Record money spent by you or the family.",
    title: "Add Expense",
    transactionType: "EXPENSE",
    updateAction: "Update expense",
    updateDescription: "Update this expense record.",
    updateTitle: "Update Expense",
  },
  income: {
    action: "Add income",
    description: "Record money received from a personal source.",
    title: "Add Income",
    transactionType: "INCOME",
    updateAction: "Update income",
    updateDescription: "Update this income record.",
    updateTitle: "Update Income",
  },
  savings: {
    action: "Add goal",
    description: "Create a savings goal and track its progress.",
    title: "Add Savings Goal",
    updateAction: "Update goal",
    updateDescription: "Update this savings goal.",
    updateTitle: "Update Savings Goal",
  },
};

const accountOptions = [
  { value: "MOBILE_MONEY", label: "Mobile money" },
  { value: "BANK_TRANSFER", label: "Bank account" },
  { value: "CASH", label: "Cash" },
  { value: "SAVINGS_WALLET", label: "Savings wallet" },
];

function defaultFormValues(
  defaultValues: Partial<MoneyFormValues> | undefined,
  categories: MoneyFormCategory[],
): MoneyFormValues {
  return {
    account: defaultValues?.account ?? "MOBILE_MONEY",
    amountMinorUnits: defaultValues?.amountMinorUnits ?? 0,
    categoryId: defaultValues?.categoryId ?? categories[0]?.id ?? "",
    date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
    notes: defaultValues?.notes ?? "",
    title: defaultValues?.title ?? "",
  };
}

export function MoneyFormDialog({
  categories = [],
  defaultValues,
  familyId,
  incomeId,
  mode = "create",
  onCategoryCreated,
  onOpenChange,
  onSuccess,
  open: controlledOpen,
  trigger,
  triggerClassName,
  triggerSize = "sm",
  type,
}: MoneyFormDialogProps) {
  const config = formConfig[type];
  const isUpdate = mode === "update";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const idempotencyKeyRef = useRef<string | undefined>(undefined);
  const activeCategories = useMemo(
    () =>
      categories.filter((category) => category.type === config.transactionType),
    [categories, config.transactionType],
  );
  const endpoint = isUpdate
    ? `/families/${encodeURIComponent(familyId ?? "")}/money/transactions/${encodeURIComponent(incomeId ?? "")}`
    : `/families/${encodeURIComponent(familyId ?? "")}/money/transactions`;

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    MoneyFormValues,
    unknown
  >({
    schema: moneyFormSchema,
    formOptions: {
      defaultValues: defaultFormValues(defaultValues, activeCategories),
    },
    request: { method: isUpdate ? "patch" : "post", url: endpoint },
    transform: (values) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }

      return {
        amountMinorUnits: Math.trunc(values.amountMinorUnits).toString(),
        categoryId: values.categoryId,
        currency: "RWF",
        date: values.date,
        description: values.title,
        incomeRecurrence: "ONE_TIME",
        notes: values.notes || undefined,
        paymentMethod: values.account,
        type: config.transactionType,
        ...(isUpdate ? {} : { idempotencyKey: idempotencyKeyRef.current }),
      };
    },
    onSuccessMessage: isUpdate
      ? "Income updated successfully"
      : "Income recorded successfully",
    toastOnSuccess: true,
    onSuccess: async () => {
      idempotencyKeyRef.current = undefined;
      setOpen(false);
      form.reset(defaultFormValues(undefined, activeCategories));
      await onSuccess?.();
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultFormValues(defaultValues, activeCategories));
    }
  }, [activeCategories, defaultValues, form, open]);

  const canSubmit = Boolean(
    familyId &&
      config.transactionType &&
      activeCategories.length &&
      (!isUpdate || incomeId),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetMessages();
      }}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size={triggerSize} className={cn(triggerClassName)}>
              {isUpdate ? (
                <PencilIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isUpdate ? config.updateAction : config.action}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? config.updateTitle : config.title}
          </DialogTitle>
          <DialogDescription>
            {isUpdate ? config.updateDescription : config.description}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Income was not saved</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <CommonFormField
              control={form.control}
              name="title"
              label="Source"
              placeholder="Example: July salary"
              required
            />
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label="Amount"
              fieldType="money"
              currency="RWF"
              placeholder="0"
              required
            />
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <CommonFormField
                control={form.control}
                name="categoryId"
                label="Category"
                fieldType="select"
                placeholder="Select category"
                required
                selectOptions={activeCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
              <CommonFormField
                control={form.control}
                name="date"
                label="Date"
                fieldType="date"
                required
              />
            </FieldGroup>
            {familyId && config.transactionType ? (
              <CreateCategoryForm
                defaultType={config.transactionType}
                existingCategories={categories}
                familyId={familyId}
                onSuccess={async (category) => {
                  await onCategoryCreated?.();
                  if (category && category.type === config.transactionType) {
                    form.setValue("categoryId", category.id, {
                      shouldValidate: true,
                    });
                  }
                }}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <FolderPlusIcon data-icon="inline-start" />
                    Add category
                  </Button>
                }
              />
            ) : null}
            <CommonFormField
              control={form.control}
              name="account"
              label="Account"
              fieldType="select"
              placeholder="Select account"
              required
              selectOptions={accountOptions}
            />
            <CommonFormField
              control={form.control}
              name="notes"
              label="Notes"
              fieldType="textarea"
              placeholder="Optional details about this income"
            />
          </FieldGroup>
          {!activeCategories.length ? (
            <p className="text-sm text-muted-foreground">
              Add an income category before saving this record.
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={!canSubmit || isPending} type="submit">
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {isUpdate ? "Save changes" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
