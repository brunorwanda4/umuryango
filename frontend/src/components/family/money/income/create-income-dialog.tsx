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

function getDefaultValues(
  receivedBy: string,
  paymentSource?: IncomeTransaction | null,
): TransactionFormValues {
  const today = new Date();
  const todayInput = formatDateInput(today);

  if (paymentSource) {
    return {
      isPaymentMode: true,
      title: paymentSource.description || paymentSource.category.name,
      amountMinorUnits: 0,
      categoryId: paymentSource.categoryId,
      date: todayInput,
      paymentMethod: paymentSource.paymentMethod || "CASH",
      receivedFrom: paymentSource.receivedFrom || "",
      receivedFromContactId: paymentSource.receivedFromContactId || "",
      receivedBy,
      notes: "",
      status: "PENDING",
      fileName: "",
      incomeRecurrence: "MONTHLY",
      expectedAmountMinorUnits: paymentSource.expectedAmountMinorUnits
        ? Number(paymentSource.expectedAmountMinorUnits)
        : undefined,
      dueDate: paymentSource.dueDate
        ? new Date(paymentSource.dueDate).toISOString().split("T")[0]
        : todayInput,
      periodStart: paymentSource.periodStart
        ? new Date(paymentSource.periodStart).toISOString().split("T")[0]
        : todayInput,
      periodEnd: paymentSource.periodEnd
        ? new Date(paymentSource.periodEnd).toISOString().split("T")[0]
        : formatDateInput(addYears(today, 2)),
      propertyName: paymentSource.propertyName || "",
    };
  }

  return {
    isPaymentMode: false,
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
  paymentSource,
  paymentAmountMinorUnits,
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
  paymentSource?: IncomeTransaction | null;
  paymentAmountMinorUnits?: string | null;
  onCategoriesChanged: (category?: Category) => void | Promise<void>;
  onContactsChanged: (contact?: FamilyContact) => void | Promise<void>;
  onSuccess: () => void;
}) {
  const isPaymentMode = Boolean(paymentSource);
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
      defaultValues: getDefaultValues(defaultReceivedBy, paymentSource),
    },
    transform: (values) => {
      const idempotencyKey = `${isPaymentMode ? "record-income-payment" : "create-income"}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      if (isPaymentMode) {
        return {
          amountMinorUnits: String(values.amountMinorUnits),
          date: new Date(values.date).toISOString(),
          paymentMethod: values.paymentMethod,
          notes: values.notes,
          receivedBy: values.receivedBy,
          idempotencyKey,
        };
      }

      return {
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
          values.incomeRecurrence === "MONTHLY"
            ? values.propertyName
            : undefined,
        idempotencyKey,
      };
    },
    request: {
      method: "post",
      url: () =>
        isPaymentMode && paymentSource
          ? `/families/${encodeURIComponent(
              family.id,
            )}/money/transactions/${encodeURIComponent(paymentSource.id)}/payments`
          : `/families/${encodeURIComponent(family.id)}/money/transactions`,
    },
    onSuccessMessage: isPaymentMode
      ? "Income payment recorded successfully"
      : "Income transaction recorded successfully",
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

    form.reset(getDefaultValues(defaultReceivedBy, paymentSource));
  }, [defaultReceivedBy, form, open, paymentSource]);

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
          <DialogTitle>
            {isPaymentMode ? "Record Income Payment" : "Add Income"}
          </DialogTitle>
          <DialogDescription>
            {isPaymentMode
              ? "Record only the money received now. The unpaid balance stays visible on the monthly income card."
              : "Record new family income details."}
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
            isPaymentMode={isPaymentMode}
            paymentSource={paymentSource}
            paymentAmountMinorUnits={paymentAmountMinorUnits}
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
              ? "Recording..."
              : isPaymentMode
                ? "Record payment"
                : "Add Income"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
