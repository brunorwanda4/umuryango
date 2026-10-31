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
import { createTranslator } from "@/i18n/translate";
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

export function EditExpenseDialog({
  open,
  onOpenChange,
  family,
  categories,
  linkOptions,
  transaction,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  categories: Category[];
  linkOptions: ExpenseLinkOptions;
  transaction: ExpenseTransaction | null;
  onSuccess: () => void;
}) {
  const t = createTranslator("FamilyExpenses");
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
        date: "",
        paidTo: "",
        paidBy: "",
        paymentMethod: "CASH",
        budgetId: "none",
        projectId: "none",
        notes: "",
        status: "PENDING",
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
      status: values.status === "DRAFT" ? "PENDING" : values.status,
    }),
    request: {
      method: "patch",
      url: `/families/${encodeURIComponent(
        family.id,
      )}/money/transactions/${transaction?.id}`,
    },
    onSuccessMessage: t((m) => m.FamilyExpenses.toasts.updatedSuccess),
    toastOnSuccess: true,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        title: transaction.description || "",
        amountMinorUnits: Number(transaction.amountMinorUnits || 0),
        categoryId: transaction.categoryId,
        date: new Date(transaction.date).toISOString().split("T")[0],
        paidTo: transaction.receivedFrom || "",
        paidBy: transaction.receivedBy || "",
        paymentMethod: transaction.paymentMethod || "CASH",
        budgetId: "none",
        projectId: "none",
        notes: transaction.notes || "",
        status:
          transaction.status === "REVERSED" ? "REJECTED" : transaction.status,
      });
    }
  }, [form, transaction]);

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
          <DialogTitle>
            {t((m) => m.FamilyExpenses.dialogs.editTitle)}
          </DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyExpenses.dialogs.editDesc)}
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-expense-form"
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
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="edit-expense-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending
              ? t((m) => m.FamilyExpenses.dialogs.saving)
              : t((m) => m.FamilyExpenses.dialogs.saveChanges)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
