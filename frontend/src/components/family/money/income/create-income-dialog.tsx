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
              fieldType="money"
              currency={family.defaultCurrency}
              placeholder="e.g. 500,000"
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

          <div className="grid grid-cols-2 gap-4">
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

            <CommonFormField
              control={form.control}
              name="fileName"
              label="Receipt/Proof (Mock Upload)"
              type="file"
              description="Upload proof of payment"
            />
          </div>
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
