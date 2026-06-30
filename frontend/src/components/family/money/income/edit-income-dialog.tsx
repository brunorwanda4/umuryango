import { useEffect } from "react";
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
import { IncomeFormFields } from "./income-form-fields";
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

          <IncomeFormFields
            control={form.control}
            family={family}
            categories={categories}
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
