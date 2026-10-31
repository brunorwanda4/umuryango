"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { FamilyDetail } from "../../dashboard/types";
import { LoanFormFields } from "./loan-form-fields";
import {
  type LoanFormValues,
  type LoanRecord,
  loanFormSchema,
} from "./types-and-schemas";

function getDefaultValues(): LoanFormValues {
  return {
    title: "",
    type: "MONEY_BORROWED",
    amountMinorUnits: 0,
    interestRatePercent: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    borrower: "",
    borrowerContactId: "__manual",
    lender: "",
    lenderContactId: "__manual",
    category: "",
    paymentMethod: "MOBILE_MONEY",
    repaymentFrequency: "MONTHLY",
    notes: "",
    documentFileName: "",
    status: "DRAFT",
    approvalStatus: "NOT_REQUIRED",
  };
}

export function CreateLoanDialog({
  family,
  contacts,
  onOpenChange,
  onSuccess,
  open,
}: {
  family: FamilyDetail;
  contacts?: FamilyContact[];
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
    formOptions: { defaultValues: getDefaultValues() },
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
      idempotencyKey: `create-loan-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(family.id)}/money/loans`,
    },
    onSuccessMessage: t((m) => m.FamilyLoans.toasts.loanRecorded),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      form.reset(getDefaultValues());
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
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          {t((m) => m.FamilyLoans.createTitle)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t((m) => m.FamilyLoans.createTitle)}</DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyLoans.createDesc)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-loan-form"
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
            form="create-loan-form"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending
              ? t((m) => m.FamilyLoans.saving)
              : t((m) => m.FamilyLoans.saveLoan)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
