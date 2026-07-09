import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
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
import { ExpenseFormFields } from "./expense-form-fields";
import { withLinkedContext } from "./expense-utils";
import {
  type Category,
  type ExpenseFormValues,
  type ExpenseLinkOptions,
  type ExpenseTransaction,
  expenseSchema,
} from "./types-and-schemas";

export function CreateExpenseDialog({
  open,
  onOpenChange,
  family,
  categories,
  linkOptions,
  duplicateValues,
  onCategoriesChanged,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  categories: Category[];
  linkOptions: ExpenseLinkOptions;
  duplicateValues?: Partial<ExpenseFormValues> | null;
  onCategoriesChanged: (category?: Category) => void | Promise<void>;
  onSuccess: () => void;
}) {
  const { user: currentUser } = useCurrentUser();
  const defaultPaidBy =
    family.members.find((member) => member.userId === currentUser?.id)
      ?.fullName ??
    currentUser?.fullName ??
    "";

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ExpenseFormValues,
    ExpenseTransaction
  >({
    schema: expenseSchema,
    formOptions: {
      defaultValues: {
        title: "",
        amountMinorUnits: 0,
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
        paidTo: "",
        paidBy: defaultPaidBy,
        paymentMethod: "CASH",
        budgetId: "none",
        projectId: "none",
        notes: "",
        status: "PENDING",
        fileName: "",
      },
    },
    transform: (values) => ({
      categoryId: values.categoryId,
      amountMinorUnits: values.amountMinorUnits,
      currency: family.defaultCurrency,
      type: "EXPENSE",
      date: new Date(values.date).toISOString(),
      description: values.title,
      paymentMethod: values.paymentMethod,
      notes: withLinkedContext(values, linkOptions),
      receivedFrom: values.paidTo,
      receivedBy: values.paidBy,
      idempotencyKey: `create-expense-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(family.id)}/money/transactions`,
    },
    onSuccessMessage: "Expense recorded successfully",
    toastOnSuccess: true,
    onSuccess: async (data, values) => {
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

  useEffect(() => {
    if (open && duplicateValues) {
      form.reset({
        title: duplicateValues.title ?? "",
        amountMinorUnits: duplicateValues.amountMinorUnits ?? 0,
        categoryId: duplicateValues.categoryId ?? "",
        date: new Date().toISOString().split("T")[0],
        paidTo: duplicateValues.paidTo ?? "",
        paidBy: duplicateValues.paidBy ?? "",
        paymentMethod: duplicateValues.paymentMethod ?? "CASH",
        budgetId: duplicateValues.budgetId ?? "none",
        projectId: duplicateValues.projectId ?? "none",
        notes: duplicateValues.notes ?? "",
        status: "PENDING",
        fileName: "",
      });
    }
  }, [duplicateValues, form, open]);

  // Backfill paidBy once the async user data resolves and the field is still empty
  useEffect(() => {
    if (defaultPaidBy && !form.getValues("paidBy")) {
      form.setValue("paidBy", defaultPaidBy, { shouldValidate: false });
    }
  }, [defaultPaidBy, form]);


  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetMessages();
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record money leaving the family and attach supporting receipt
            details.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-expense-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-4"
        >
          {error ? (
            <div className="font-medium text-destructive text-sm">{error}</div>
          ) : null}
          <ExpenseFormFields
            control={form.control}
            family={family}
            categories={categories}
            linkOptions={linkOptions}
            onCategoriesChanged={onCategoriesChanged}
            showReceiptUpload
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="create-expense-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Recording..." : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
