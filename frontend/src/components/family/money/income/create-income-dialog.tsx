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
import type { CurrentUser } from "@/hooks/use-current-user";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { FamilyDetail } from "../../dashboard/types";
import { IncomeFormFields } from "./income-form-fields";
import {
  type Category,
  type IncomeTransaction,
  type TransactionFormValues,
  transactionSchema,
} from "./types-and-schemas";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addYears(date: Date, years: number) {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
}

function getDefaultValues(receivedBy: string): TransactionFormValues {
  const today = new Date();
  const todayInput = formatDateInput(today);

  return {
    title: "",
    amountMinorUnits: 0,
    categoryId: "",
    date: todayInput,
    paymentMethod: "CASH",
    receivedFrom: "",
    receivedFromContactId: "",
    receivedBy,
    notes: "",
    status: "PENDING",
    fileName: "",
    incomeRecurrence: "ONE_TIME",
    expectedAmountMinorUnits: undefined,
    dueDate: todayInput,
    periodStart: todayInput,
    periodEnd: formatDateInput(addYears(today, 2)),
    propertyName: "",
  };
}

export function CreateIncomeDialog({
  open,
  onOpenChange,
  family,
  categories,
  contacts,
  currentUser,
  onCategoriesChanged,
  onContactsChanged,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  categories: Category[];
  contacts: FamilyContact[];
  currentUser: CurrentUser | null;
  onCategoriesChanged: (category?: Category) => void | Promise<void>;
  onContactsChanged: (contact?: FamilyContact) => void | Promise<void>;
  onSuccess: () => void;
}) {
  const t = createTranslator("FamilyIncome");
  const defaultReceivedBy =
    family.members.find((member) => member.userId === currentUser?.id)
      ?.fullName ??
    currentUser?.fullName ??
    "";

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    TransactionFormValues,
    IncomeTransaction
  >({
    schema: transactionSchema,
    formOptions: {
      defaultValues: getDefaultValues(defaultReceivedBy),
    },
    transform: (values) => ({
      categoryId: values.categoryId,
      amountMinorUnits: String(values.amountMinorUnits),
      currency: family.defaultCurrency,
      type: "INCOME",
      date: new Date(values.date).toISOString(),
      description: values.title,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
      receivedFrom: values.receivedFrom,
      receivedFromContactId: values.receivedFromContactId || undefined,
      receivedBy: values.receivedBy,
      incomeRecurrence: values.incomeRecurrence,
      expectedAmountMinorUnits:
        values.incomeRecurrence === "MONTHLY"
          ? String(values.expectedAmountMinorUnits ?? 0)
          : undefined,
      dueDate:
        values.incomeRecurrence === "MONTHLY" && values.dueDate
          ? new Date(values.dueDate).toISOString()
          : undefined,
      periodStart:
        values.incomeRecurrence === "MONTHLY" && values.periodStart
          ? new Date(values.periodStart).toISOString()
          : undefined,
      periodEnd:
        values.incomeRecurrence === "MONTHLY" && values.periodEnd
          ? new Date(values.periodEnd).toISOString()
          : undefined,
      propertyName:
        values.incomeRecurrence === "MONTHLY" ? values.propertyName : undefined,
      idempotencyKey: `create-income-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(family.id)}/money/transactions`,
    },
    onSuccessMessage: t((m) => m.FamilyIncome.toasts.recordedSuccess),
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
      form.reset(getDefaultValues(defaultReceivedBy));
      onSuccess();
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(defaultReceivedBy));
  }, [defaultReceivedBy, form, open]);

  useEffect(() => {
    if (!open || !defaultReceivedBy || form.getValues("receivedBy")) return;

    form.setValue("receivedBy", defaultReceivedBy, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultReceivedBy, form, open]);

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
          <DialogTitle>{t((m) => m.FamilyIncome.dialogs.addTitle)}</DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyIncome.dialogs.addDesc)}
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
            contacts={contacts}
            setValue={form.setValue}
            onCategoriesChanged={onCategoriesChanged}
            onContactsChanged={onContactsChanged}
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
            {isPending
              ? t((m) => m.FamilyIncome.dialogs.recording)
              : t((m) => m.FamilyIncome.addIncome)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
