import { useEffect } from "react";
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
import {
  type Category,
  type IncomeTransaction,
  type TransactionFormValues,
  transactionSchema,
} from "./types-and-schemas";

export function EditIncomeDialog({
  open,
  onOpenChange,
  family,
  categories,
  transaction,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  categories: Category[];
  transaction: IncomeTransaction | null;
  onSuccess: () => void;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    TransactionFormValues,
    IncomeTransaction
  >({
    schema: transactionSchema,
    formOptions: {
      defaultValues: {
        title: transaction?.description || "",
        amountMinorUnits: Number(transaction?.amountMinorUnits || 0),
        categoryId: transaction?.categoryId || "",
        date: transaction
          ? new Date(transaction.date).toISOString().split("T")[0]
          : "",
        paymentMethod: transaction?.paymentMethod || "CASH",
        receivedFrom: transaction?.receivedFrom || "",
        receivedBy: transaction?.receivedBy || "",
        notes: transaction?.notes || "",
        status: transaction?.status || "PENDING",
      },
    },
    transform: (values) => ({
      categoryId: values.categoryId,
      amountMinorUnits: values.amountMinorUnits,
      currency: family.defaultCurrency,
      type: "INCOME",
      date: new Date(values.date).toISOString(),
      description: values.title,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
      receivedFrom: values.receivedFrom,
      receivedBy: values.receivedBy,
      status: values.status,
    }),
    request: {
      method: "patch",
      url: `/families/${encodeURIComponent(family.id)}/money/transactions/${transaction?.id}`,
    },
    onSuccessMessage: "Income transaction updated successfully",
    toastOnSuccess: true,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  // Reset form with transaction values when open changes or transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        title: transaction.description || "",
        amountMinorUnits: Number(transaction.amountMinorUnits || 0),
        categoryId: transaction.categoryId,
        date: new Date(transaction.date).toISOString().split("T")[0],
        paymentMethod: transaction.paymentMethod || "CASH",
        receivedFrom: transaction.receivedFrom || "",
        receivedBy: transaction.receivedBy || "",
        notes: transaction.notes || "",
        status: transaction.status,
      });
    }
  }, [transaction, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetMessages();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Income Record</DialogTitle>
          <DialogDescription>
            Update the transaction details. Keep in mind edits generate audit
            logs.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-income-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-4"
        >
          {error && (
            <div className="text-sm text-destructive font-medium">{error}</div>
          )}

          <CommonFormField
            control={form.control}
            name="title"
            label="Income title"
            placeholder="e.g. June Salary"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label={`Amount (${family.defaultCurrency})`}
              type="number"
              placeholder="e.g. 500000"
              required
            />

            <CommonFormField
              control={form.control}
              name="date"
              label="Date received"
              fieldType="date"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CommonFormField
              control={form.control}
              name="categoryId"
              label="Category"
              fieldType="select"
              selectOptions={categories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
              placeholder="Select Category"
              required
            />

            <CommonFormField
              control={form.control}
              name="paymentMethod"
              label="Payment method"
              fieldType="select"
              selectOptions={[
                { label: "Cash", value: "CASH" },
                { label: "Mobile Money", value: "MOBILE_MONEY" },
                { label: "Bank Transfer", value: "BANK_TRANSFER" },
                { label: "Card", value: "CARD" },
                { label: "Cheque", value: "CHEQUE" },
                { label: "Other", value: "OTHER" },
              ]}
              placeholder="Select Payment Method"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CommonFormField
              control={form.control}
              name="receivedFrom"
              label="Received from"
              placeholder="e.g. MTN Rwanda"
            />

            <CommonFormField
              control={form.control}
              name="receivedBy"
              label="Received by"
              fieldType="select"
              selectOptions={family.members.map((m) => ({
                label: m.fullName,
                value: m.fullName,
              }))}
              placeholder="Select Member"
            />
          </div>

          <CommonFormField
            control={form.control}
            name="notes"
            label="Notes"
            fieldType="textarea"
            placeholder="Optional additional notes"
          />

          <CommonFormField
            control={form.control}
            name="status"
            label="Status"
            fieldType="select"
            selectOptions={[
              { label: "Pending Approval", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
            ]}
            required
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="edit-income-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Saving changes..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
