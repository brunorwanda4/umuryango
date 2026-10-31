"use client";

import { CheckCircle2Icon, HandCoinsIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { CompactMoney } from "@/components/common/money/compact-money";
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
import {
  type LoanPayment,
  type PersonalLoan,
  type RecordPaymentFormValues,
  recordPaymentSchema,
} from "./types-and-schemas";

export function RecordPaymentForm({
  familyId,
  loan,
  onOpenChange,
  onSuccess,
  open,
}: {
  familyId: string;
  loan: PersonalLoan | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const t = createTranslator("PersonalLoans");
  const remaining = Number(loan?.remainingBalanceMinorUnits ?? 0);
  const schema = useMemo(
    () =>
      recordPaymentSchema.refine(
        (values) => values.amountMinorUnits <= remaining,
        {
          message: "Payment cannot exceed the remaining balance",
          path: ["amountMinorUnits"],
        },
      ),
    [remaining],
  );
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    RecordPaymentFormValues,
    LoanPayment
  >({
    schema,
    formOptions: {
      defaultValues: {
        amountMinorUnits: 0,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "MOBILE_MONEY",
        notes: "",
        payFull: false,
      },
    },
    transform: (values) => ({
      amountMinorUnits: String(
        values.payFull ? remaining : values.amountMinorUnits,
      ),
      paymentDate: new Date(values.paymentDate).toISOString(),
      paymentMethod: values.paymentMethod,
      notes: values.notes || null,
      idempotencyKey: `personal-loan-payment-${crypto.randomUUID()}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/loans/${encodeURIComponent(loan?.id ?? "")}/repayments`,
    },
    onSuccessMessage: t(
      (m) => m.PersonalLoans.paymentForm.paymentRecordedToast,
    ),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });
  const payFull = useWatch({ control: form.control, name: "payFull" });

  useEffect(() => {
    if (payFull)
      form.setValue("amountMinorUnits", remaining, { shouldValidate: true });
  }, [form, payFull, remaining]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen)
          form.reset({
            amountMinorUnits: 0,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentMethod: "MOBILE_MONEY",
            notes: "",
            payFull: false,
          });
        else resetMessages();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t((m) => m.PersonalLoans.paymentForm.title)}
          </DialogTitle>
          <DialogDescription>
            {t((m) => m.PersonalLoans.paymentForm.description, {
              title: loan?.title ?? "",
            })}{" "}
            {loan ? (
              <CompactMoney
                currency={loan.currency}
                value={loan.remainingBalanceMinorUnits}
              />
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <form
          id="record-personal-loan-payment"
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <CommonFormField
            control={form.control}
            name="payFull"
            label={t((m) => m.PersonalLoans.paymentForm.payFull)}
            fieldType="checkbox"
          />
          <CommonFormField
            control={form.control}
            name="amountMinorUnits"
            label={t((m) => m.PersonalLoans.paymentForm.amount)}
            fieldType="money"
            currency={loan?.currency ?? "RWF"}
            disabled={payFull}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="paymentDate"
              label={t((m) => m.PersonalLoans.paymentForm.date)}
              fieldType="date"
              required
            />
            <CommonFormField
              control={form.control}
              name="paymentMethod"
              label={t((m) => m.PersonalLoans.paymentForm.method)}
              fieldType="select"
              selectOptions={[
                {
                  label: t((m) => m.PersonalLoans.paymentForm.methods.cash),
                  value: "CASH",
                },
                {
                  label: t(
                    (m) => m.PersonalLoans.paymentForm.methods.mobileMoney,
                  ),
                  value: "MOBILE_MONEY",
                },
                {
                  label: t(
                    (m) => m.PersonalLoans.paymentForm.methods.bankTransfer,
                  ),
                  value: "BANK_TRANSFER",
                },
                {
                  label: t((m) => m.PersonalLoans.paymentForm.methods.card),
                  value: "CARD",
                },
                {
                  label: t((m) => m.PersonalLoans.paymentForm.methods.other),
                  value: "OTHER",
                },
              ]}
              required
            />
          </div>
          <CommonFormField
            control={form.control}
            name="notes"
            label={t((m) => m.PersonalLoans.paymentForm.note)}
            fieldType="textarea"
            placeholder={t((m) => m.PersonalLoans.paymentForm.notePlaceholder)}
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="record-personal-loan-payment"
            disabled={isPending || !loan}
            className="w-full sm:w-auto"
          >
            {payFull ? (
              <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
            ) : (
              <HandCoinsIcon aria-hidden="true" data-icon="inline-start" />
            )}
            {isPending
              ? t((m) => m.PersonalLoans.paymentForm.recording)
              : payFull
                ? t((m) => m.PersonalLoans.paymentForm.payFullBalance)
                : t((m) => m.PersonalLoans.paymentForm.recordPayment)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
