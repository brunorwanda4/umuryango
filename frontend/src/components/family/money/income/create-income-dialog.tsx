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
import apiRequest from "@/service/api";
import type { FamilyDetail } from "../../dashboard/types";
import { IncomeFormFields } from "./income-form-fields";
import {
  type Category,
  type IncomeTransaction,
  type TransactionFormValues,
  transactionSchema,
} from "./types-and-schemas";

export function CreateIncomeDialog({
  open,
  onOpenChange,
  family,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  categories: Category[];
  onSuccess: () => void;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    TransactionFormValues,
    IncomeTransaction
  >({
    schema: transactionSchema,
    formOptions: {
      defaultValues: {
        title: "",
        amountMinorUnits: 0,
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        receivedFrom: "",
        receivedBy: "",
        notes: "",
        status: "PENDING",
        fileName: "",
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
      idempotencyKey: `create-income-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(family.id)}/money/transactions`,
    },
    onSuccessMessage: "Income transaction recorded successfully",
    toastOnSuccess: true,
    onSuccess: async (data, values) => {
      // If mock file upload was requested
      if (values.fileName && data?.id) {
        await apiRequest(
          "post",
          `/families/${encodeURIComponent(family.id)}/money/receipts`,
          {
            transactionId: data.id,
            fileName: values.fileName || "receipt.pdf",
            fileType: "application/pdf",
            fileSizeBytes: 1024,
            storageKey: `mock-bunny-storage-key-${Date.now()}`,
          },
        );
      }
      onOpenChange(false);
      form.reset();
      onSuccess();
    },
  });

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
          <DialogTitle>Add Income</DialogTitle>
          <DialogDescription>
            Record new family income details.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-income-form"
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
            showReceiptUpload
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="create-income-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Recording..." : "Add Income"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
