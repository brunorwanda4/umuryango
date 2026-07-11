"use client";

import { PencilIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import { useForm } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
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
import { cn } from "@/lib/utils";

type MoneyFormType = "income" | "expense" | "savings" | "debt";

interface MoneyFormDialogProps {
  type: MoneyFormType;
  defaultValues?: Partial<MoneyFormValues>;
  mode?: "create" | "update";
  trigger?: React.ReactElement;
  triggerClassName?: string;
  triggerSize?: React.ComponentProps<typeof Button>["size"];
}

type MoneyFormValues = {
  title: string;
  amountMinorUnits: number;
  category: string;
  date: string;
  account: string;
};

const formConfig: Record<
  MoneyFormType,
  {
    action: string;
    categories: string[];
    description: string;
    title: string;
    updateAction: string;
    updateDescription: string;
    updateTitle: string;
  }
> = {
  debt: {
    action: "Add debt",
    categories: ["Borrowed money", "Lent money", "Repayment plan"],
    description: "Track borrowed or lent money before connecting live data.",
    title: "Add Debt",
    updateAction: "Update debt",
    updateDescription: "Update this debt record before connecting live data.",
    updateTitle: "Update Debt",
  },
  expense: {
    action: "Add expense",
    categories: ["Education", "Health", "Food", "Transport", "Events"],
    description: "Record money spent by you or the family.",
    title: "Add Expense",
    updateAction: "Update expense",
    updateDescription:
      "Update this expense record before connecting live data.",
    updateTitle: "Update Expense",
  },
  income: {
    action: "Add income",
    categories: ["Salary", "Business", "Contribution", "Gift", "Other"],
    description: "Record money received from personal or family sources.",
    title: "Add Income",
    updateAction: "Update income",
    updateDescription: "Update this income record before connecting live data.",
    updateTitle: "Update Income",
  },
  savings: {
    action: "Add goal",
    categories: ["Emergency fund", "Education", "Project", "Event", "Other"],
    description: "Create a savings goal and track progress toward it.",
    title: "Add Savings Goal",
    updateAction: "Update goal",
    updateDescription: "Update this savings goal before connecting live data.",
    updateTitle: "Update Savings Goal",
  },
};

const accountOptions = [
  { value: "mobile-money", label: "Mobile money" },
  { value: "bank-account", label: "Bank account" },
  { value: "cash", label: "Cash" },
  { value: "savings-wallet", label: "Savings wallet" },
];

export function MoneyFormDialog({
  defaultValues,
  mode = "create",
  type,
  trigger,
  triggerClassName,
  triggerSize = "sm",
}: MoneyFormDialogProps) {
  const config = formConfig[type];
  const isUpdate = mode === "update";
  const form = useForm<MoneyFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? "",
      amountMinorUnits: defaultValues?.amountMinorUnits ?? 0,
      category: defaultValues?.category ?? config.categories[0] ?? "",
      date: defaultValues?.date ?? "",
      account: defaultValues?.account ?? "mobile-money",
    },
  });

  return (
    <Dialog syncWithSearchParams={false}>
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
          onSubmit={form.handleSubmit(() => undefined)}
        >
          <FieldGroup>
            <CommonFormField
              control={form.control}
              name="title"
              label="Title"
              placeholder="Example: Monthly contribution"
            />
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label="Amount"
              fieldType="money"
              currency="RWF"
              placeholder="0"
            />
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <CommonFormField
                control={form.control}
                name="category"
                label="Category"
                fieldType="select"
                placeholder="Select category"
                selectOptions={config.categories.map((category) => ({
                  value: category,
                  label: category,
                }))}
              />
              <CommonFormField
                control={form.control}
                name="date"
                label="Date"
                fieldType="date"
              />
            </FieldGroup>
            <CommonFormField
              control={form.control}
              name="account"
              label="Account"
              fieldType="select"
              placeholder="Select account"
              selectOptions={accountOptions}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              {isUpdate ? "Save changes" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
