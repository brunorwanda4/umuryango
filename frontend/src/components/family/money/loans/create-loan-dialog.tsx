"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import type { FamilyDetail } from "../../dashboard/types";
import { LoanFormFields } from "./loan-form-fields";
import { percentToBasisPoints } from "./loan-utils";
import {
  type LoanFormValues,
  type LoanRecord,
  loanFormSchema,
} from "./types-and-schemas";

function getDefaultValues(): LoanFormValues {
  return {
    title: "",
    type: "MONEY_BORROWED",
    amountMinorUnits: 0,
    interestRatePercent: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    borrower: "",
    lender: "",
    category: "",
    paymentMethod: "MOBILE_MONEY",
    repaymentFrequency: "MONTHLY",
    notes: "",
    documentFileName: "",
    status: "DRAFT",
    approvalStatus: "NOT_REQUIRED",
  };
}

export function CreateLoanDialog({
  family,
  onOpenChange,
  onSuccess,
  open,
}: {
  family: FamilyDetail;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    LoanFormValues,
    LoanRecord
  >({
    schema: loanFormSchema,
    formOptions: { defaultValues: getDefaultValues() },
    transform: (values) => ({
      title: values.title,
      type: values.type,
      originalAmountMinorUnits: values.amountMinorUnits,
      currency: family.defaultCurrency,
      interestRateBasisPoints: percentToBasisPoints(values.interestRatePercent),
      startDate: new Date(values.startDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      borrower: values.borrower,
      lender: values.lender,
      category: values.category || null,
      paymentMethod: values.paymentMethod,
      repaymentFrequency: values.repaymentFrequency,
      notes: values.notes,
      documentFileName: values.documentFileName,
      status: values.status,
      approvalStatus: values.approvalStatus,
      idempotencyKey: `create-loan-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(family.id)}/money/loans`,
    },
    onSuccessMessage: "Loan recorded successfully",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      form.reset(getDefaultValues());
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          Add Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Loan</DialogTitle>
          <DialogDescription>
            Record money borrowed or lent, repayment terms, documents, and
            approval state.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-loan-form"
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          <LoanFormFields control={form.control} family={family} />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-loan-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Loan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
