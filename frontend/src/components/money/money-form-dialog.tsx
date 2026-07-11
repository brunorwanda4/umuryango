"use client";

import { PlusIcon } from "lucide-react";
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
  }
> = {
  debt: {
    action: "Add debt",
    categories: ["Borrowed money", "Lent money", "Repayment plan"],
    description: "Track borrowed or lent money before connecting live data.",
    title: "Add Debt",
  },
  expense: {
    action: "Add expense",
    categories: ["Education", "Health", "Food", "Transport", "Events"],
    description: "Record money spent by you or the family.",
    title: "Add Expense",
  },
  income: {
    action: "Add income",
    categories: ["Salary", "Business", "Contribution", "Gift", "Other"],
    description: "Record money received from personal or family sources.",
    title: "Add Income",
  },
  savings: {
    action: "Add goal",
    categories: ["Emergency fund", "Education", "Project", "Event", "Other"],
    description: "Create a savings goal and track progress toward it.",
    title: "Add Savings Goal",
  },
};

const accountOptions = [
  { value: "mobile-money", label: "Mobile money" },
  { value: "bank-account", label: "Bank account" },
  { value: "cash", label: "Cash" },
  { value: "savings-wallet", label: "Savings wallet" },
];

export function MoneyFormDialog({
  type,
  triggerClassName,
  triggerSize = "sm",
}: MoneyFormDialogProps) {
  const config = formConfig[type];
  const form = useForm<MoneyFormValues>({
    defaultValues: {
      title: "",
      amountMinorUnits: 0,
      category: config.categories[0] ?? "",
      date: "",
      account: "mobile-money",
    },
  });

  return (
    <Dialog syncWithSearchParams={false}>
      <DialogTrigger asChild>
        <Button size={triggerSize} className={cn(triggerClassName)}>
          <PlusIcon data-icon="inline-start" />
          {config.action}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
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
            <Button type="submit">Save entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
