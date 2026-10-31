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
import { createTranslator } from "@/i18n/translate";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { FamilyDetail } from "../../dashboard/types";
import { LoanFormFields } from "./loan-form-fields";
import { basisPointsToPercentInput } from "./loan-utils";
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
    borrowerContactId: loan?.borrowerContactId ?? "__manual",
    lender: loan?.lender ?? "",
    lenderContactId: loan?.lenderContactId ?? "__manual",
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
  contacts,
  loan,
  onOpenChange,
  onSuccess,
  open,
}: {
  family: FamilyDetail;
  contacts?: FamilyContact[];
  loan: LoanRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const t = createTranslator("FamilyLoans");
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    LoanFormValues,
    LoanRecord
  >({
    schema: loanFormSchema,
    formOptions: { defaultValues: getDefaultValues(loan) },
    transform: (values) => ({
      title: values.title,
      description: values.notes || null,
      loanType: values.type === "MONEY_BORROWED" ? "BORROWED" : "LENT",
      principalAmountMinorUnits: String(values.amountMinorUnits),
      currency: family.defaultCurrency,
      interestRate: values.interestRatePercent || "0",
      interestType: values.interestRatePercent ? "PERCENTAGE" : "NONE",
      startDate: new Date(values.startDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      borrowerName: values.borrower || null,
      borrowerContactId:
        values.borrowerContactId && values.borrowerContactId !== "__manual"
          ? values.borrowerContactId
          : null,
      lenderName: values.lender || null,
      lenderContactId:
        values.lenderContactId && values.lenderContactId !== "__manual"
          ? values.lenderContactId
          : null,
      categoryId: values.category || null,
      repaymentFrequency:
        values.repaymentFrequency === "ONE_TIME"
          ? "ONCE"
          : values.repaymentFrequency,
    }),
    request: {
      method: "patch",
      url: `/families/${encodeURIComponent(
        family.id,
      )}/money/loans/${encodeURIComponent(loan?.id ?? "")}`,
    },
    onSuccessMessage: t("toasts.loanUpdated"),
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
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>{t("editDesc")}</DialogDescription>
        </DialogHeader>
        <form
          id="edit-loan-form"
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          <LoanFormFields
            contacts={contacts}
            control={form.control}
            family={family}
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="edit-loan-form"
            disabled={isPending || !loan || loan.status === "COMPLETED"}
            className="w-full sm:w-auto"
          >
            {isPending ? t("saving") : t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
