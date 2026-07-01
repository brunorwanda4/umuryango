"use client";

import { CommonFormField } from "@/components/common/form/common-form-field";
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
import { formatMinorUnits } from "../utils";
import { toMinorNumber } from "./loan-utils";
import {
  type LoanRecord,
  type LoanRepayment,
  paymentMethods,
  type RepaymentFormValues,
  repaymentFormSchema,
} from "./types-and-schemas";

function getDefaultValues(loan: LoanRecord | null): RepaymentFormValues {
  return {
    amountMinorUnits: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: loan?.paymentMethod ?? "MOBILE_MONEY",
    paidBy: loan?.borrower ?? "",
    receivedBy: loan?.lender ?? "",
    receiptFileName: "",
    notes: "",
    allowOverpayment: false,
  };
}

export function AddRepaymentDialog({
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
    RepaymentFormValues,
    LoanRepayment
  >({
    schema: repaymentFormSchema,
    formOptions: { defaultValues: getDefaultValues(loan) },
    transform: (values) => ({
      amountMinorUnits: values.amountMinorUnits,
      paymentDate: new Date(values.paymentDate).toISOString(),
      paymentMethod: values.paymentMethod,
      paidBy: values.paidBy,
      receivedBy: values.receivedBy,
      receiptFileName: values.receiptFileName,
      notes: values.notes,
      allowOverpayment: values.allowOverpayment,
      idempotencyKey: `loan-repayment-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(
        family.id,
      )}/money/loans/${encodeURIComponent(loan?.id ?? "")}/repayments`,
    },
    onSuccessMessage: "Repayment recorded successfully",
    toastOnSuccess: true,
    toastOnError: true,
    onError: async (message) => {
      if (message) return;
    },
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  const remaining = toMinorNumber(loan?.remainingBalanceMinorUnits);
  const amountPaid = Number(form.watch("amountMinorUnits") ?? 0);
  const allowOverpayment = Boolean(form.watch("allowOverpayment"));
  const exceedsRemaining = amountPaid > remaining && !allowOverpayment;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
        if (nextOpen) form.reset(getDefaultValues(loan));
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Repayment</DialogTitle>
          <DialogDescription>
            Record a payment against {loan?.title ?? "this loan"}. Remaining
            balance: {formatMinorUnits(remaining, family.defaultCurrency)}.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-repayment-form"
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          {exceedsRemaining ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
              Repayments cannot exceed the remaining balance unless admin
              overpayment is allowed.
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label={`Amount paid (${family.defaultCurrency})`}
              fieldType="money"
              currency={family.defaultCurrency}
              required
            />
            <CommonFormField
              control={form.control}
              name="paymentDate"
              label="Payment date"
              fieldType="date"
              required
            />
          </div>
          <CommonFormField
            control={form.control}
            name="paymentMethod"
            label="Payment method"
            fieldType="select"
            selectOptions={paymentMethods}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="paidBy"
              label="Paid by"
              placeholder="Who made the payment?"
              required
            />
            <CommonFormField
              control={form.control}
              name="receivedBy"
              label="Received by"
              placeholder="Who received the payment?"
              required
            />
          </div>
          <CommonFormField
            control={form.control}
            name="receiptFileName"
            label="Receipt"
            type="file"
            description="Attach proof of repayment."
          />
          <CommonFormField
            control={form.control}
            name="notes"
            label="Notes"
            fieldType="textarea"
            placeholder="Any repayment context or reference number"
          />
          <CommonFormField
            control={form.control}
            name="allowOverpayment"
            label="Allow admin overpayment"
            fieldType="checkbox"
            description="Use only when an administrator intentionally records extra payment."
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="add-repayment-form"
            disabled={
              isPending ||
              !loan ||
              loan.status === "COMPLETED" ||
              exceedsRemaining
            }
            className="w-full sm:w-auto"
          >
            {isPending ? "Recording..." : "Record Repayment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
