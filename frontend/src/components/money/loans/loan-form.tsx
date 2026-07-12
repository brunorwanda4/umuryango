"use client";

import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyContact } from "@/components/family/contacts/types-and-schemas";
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
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { PersonSelector } from "./person-selector";
import {
  type LoanCategory,
  type PersonalLoan,
  type PersonalLoanFormValues,
  personalLoanFormSchema,
} from "./types-and-schemas";

const today = () => new Date().toISOString().slice(0, 10);

export function LoanForm({
  categories,
  contacts,
  currency,
  familyId,
  onOpenChange,
  onPersonCreated,
  onSuccess,
  open,
}: {
  categories: LoanCategory[];
  contacts: FamilyContact[];
  currency: string;
  familyId: string;
  onOpenChange: (open: boolean) => void;
  onPersonCreated: (person: FamilyContact) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    PersonalLoanFormValues,
    PersonalLoan
  >({
    schema: personalLoanFormSchema,
    formOptions: {
      defaultValues: {
        title: "",
        type: "BORROWED",
        personContactId: "",
        amountMinorUnits: 0,
        startDate: today(),
        dueDate: "",
        notes: "",
        repaymentFrequency: "ONCE",
        useInterest: false,
        interestRate: "",
        categoryId: "",
      },
    },
    transform: (values) => ({
      title: values.title,
      loanType: values.type,
      personContactId: values.personContactId,
      principalAmountMinorUnits: String(values.amountMinorUnits),
      currency,
      startDate: new Date(values.startDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      notes: values.notes || null,
      repaymentFrequency: values.repaymentFrequency,
      interestType: values.useInterest ? "PERCENTAGE" : "NONE",
      interestRate: values.useInterest ? values.interestRate : "0",
      categoryId: values.categoryId || null,
      idempotencyKey: `personal-loan-${crypto.randomUUID()}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/loans/personal`,
    },
    onSuccessMessage: "Loan added",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
  });
  const loanType = useWatch({ control: form.control, name: "type" });
  const useInterest = useWatch({ control: form.control, name: "useInterest" });
  const categoryOptions = categories
    .filter(
      (category) =>
        category.status === "ACTIVE" &&
        category.type === (loanType === "BORROWED" ? "INCOME" : "EXPENSE"),
    )
    .map((category) => ({ label: category.name, value: category.id }));

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
          <DialogTitle>Add new loan</DialogTitle>
          <DialogDescription>
            Track money borrowed from or lent to one trusted person.
          </DialogDescription>
        </DialogHeader>
        <form
          id="personal-loan-form"
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <CommonFormField
            control={form.control}
            name="title"
            label="Loan title"
            placeholder="e.g. School fees support"
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="type"
              label="Loan type"
              fieldType="select"
              selectOptions={[
                { label: "Borrowed", value: "BORROWED" },
                { label: "Lent", value: "LENT" },
              ]}
              required
            />
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label="Amount"
              fieldType="money"
              currency={currency}
              required
            />
          </div>
          <PersonSelector
            contacts={contacts}
            control={form.control}
            familyId={familyId}
            onPersonCreated={(person) => {
              onPersonCreated(person);
              form.setValue("personContactId", person.id, {
                shouldValidate: true,
              });
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="startDate"
              label="Start date"
              fieldType="date"
              required
            />
            <CommonFormField
              control={form.control}
              name="dueDate"
              label="Due date"
              fieldType="date"
              inputProps={{ min: form.watch("startDate") }}
              required
            />
          </div>
          <CommonFormField
            control={form.control}
            name="notes"
            label="Note"
            fieldType="textarea"
            placeholder="Optional context or repayment agreement"
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
                Additional details
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
            <CollapsibleContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="repaymentFrequency"
                  label="Repayment frequency"
                  fieldType="select"
                  selectOptions={[
                    { label: "One-time", value: "ONCE" },
                    { label: "Weekly", value: "WEEKLY" },
                    { label: "Every two weeks", value: "BIWEEKLY" },
                    { label: "Monthly", value: "MONTHLY" },
                    { label: "Quarterly", value: "QUARTERLY" },
                    { label: "Yearly", value: "YEARLY" },
                  ]}
                />
                {categoryOptions.length ? (
                  <CommonFormField
                    control={form.control}
                    name="categoryId"
                    label="Category"
                    fieldType="select"
                    placeholder="No category"
                    selectOptions={categoryOptions}
                  />
                ) : null}
              </div>
              <CommonFormField
                control={form.control}
                name="useInterest"
                label="Use optional simple interest"
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
              {useInterest ? (
                <CommonFormField
                  control={form.control}
                  name="interestRate"
                  label="Interest rate (%)"
                  placeholder="e.g. 5"
                  inputProps={{ inputMode: "decimal" }}
                  required
                />
              ) : null}
            </CollapsibleContent>
          </Collapsible>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="personal-loan-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            {isPending ? "Adding..." : "Add loan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
