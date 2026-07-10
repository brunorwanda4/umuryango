"use client";

import { PlusIcon } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MoneyFormType = "income" | "expense" | "savings" | "debt";

interface MoneyFormDialogProps {
  type: MoneyFormType;
}

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

export function MoneyFormDialog({ type }: MoneyFormDialogProps) {
  const config = formConfig[type];
  const fieldPrefix = `money-${type}`;

  return (
    <Dialog syncWithSearchParams={false}>
      <DialogTrigger asChild>
        <Button size="sm">
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
          onSubmit={(event) => event.preventDefault()}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldPrefix}-title`}>Title</FieldLabel>
              <Input
                id={`${fieldPrefix}-title`}
                placeholder="Example: Monthly contribution"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${fieldPrefix}-amount`}>Amount</FieldLabel>
              <Input
                id={`${fieldPrefix}-amount`}
                inputMode="numeric"
                min="0"
                placeholder="0"
                type="number"
              />
            </Field>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-category`}>
                  Category
                </FieldLabel>
                <Select defaultValue={config.categories[0]}>
                  <SelectTrigger
                    id={`${fieldPrefix}-category`}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {config.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-date`}>Date</FieldLabel>
                <Input id={`${fieldPrefix}-date`} type="date" />
              </Field>
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldPrefix}-account`}>
                Account
              </FieldLabel>
              <Select defaultValue="mobile-money">
                <SelectTrigger id={`${fieldPrefix}-account`} className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="mobile-money">Mobile money</SelectItem>
                    <SelectItem value="bank-account">Bank account</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="savings-wallet">
                      Savings wallet
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
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
