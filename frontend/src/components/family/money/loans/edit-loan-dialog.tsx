"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import type { FamilyDetail } from "../../dashboard/types";
import { LoanFormFields } from "./loan-form-fields";
import { basisPointsToPercentInput, percentToBasisPoints } from "./loan-utils";
import {
  type LoanFormValues,
  type LoanRecord,
  loanFormSchema,
} from "./types-and-schemas";

function getDefaultValues(loan: LoanRecord | null): LoanFormValues {
  return {
    title: loan?.title ?? "",
    type: loan?.type ?? "MONEY_BORROWED",
    amountMinorUnits: Number(loan?.originalAmountMinorUnits ?? 0),
    interestRatePercent: basisPointsToPercentInput(
      loan?.interestRateBasisPoints,
    ),
    startDate: loan?.startDate
      ? new Date(loan.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    dueDate: loan?.dueDate
      ? new Date(loan.dueDate).toISOString().split("T")[0]
      : "",
    borrower: loan?.borrower ?? "",
    lender: loan?.lender ?? "",
    category: loan?.category ?? "",
    paymentMethod: loan?.paymentMethod ?? "MOBILE_MONEY",
    repaymentFrequency: loan?.repaymentFrequency ?? "MONTHLY",
    notes: loan?.notes ?? "",
    documentFileName: "",
    status: loan?.status ?? "DRAFT",
    approvalStatus: loan?.approvalStatus ?? "NOT_REQUIRED",
  };
}

export function EditLoanDialog({
  family,
  loan,
  onOpenChange,
  onSuccess,
  open,
}: {
  family: FamilyDetail;
  loan: LoanRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    LoanFormValues,
    LoanRecord
  >({
    schema: loanFormSchema,
    formOptions: { defaultValues: getDefaultValues(loan) },
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
    }),
    request: {
      method: "patch",
      url: `/families/${encodeURIComponent(
        family.id,
      )}/money/loans/${encodeURIComponent(loan?.id ?? "")}`,
    },
    onSuccessMessage: "Loan updated successfully",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
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
        if (nextOpen) form.reset(getDefaultValues(loan));
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Loan</DialogTitle>
          <DialogDescription>
            Completed loans are locked unless an administrator reopens them.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-loan-form"
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
            form="edit-loan-form"
            disabled={isPending || !loan || loan.status === "COMPLETED"}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
