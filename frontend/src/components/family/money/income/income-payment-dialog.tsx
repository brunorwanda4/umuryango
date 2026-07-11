"use client";

import { AlertCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CurrentUser } from "@/hooks/use-current-user";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import apiRequest from "@/service/api";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

const CREATE_PAYER_CONTACT_VALUE = "__create_payer_contact__";

const incomePaymentSchema = z.object({
  amountMinorUnits: z.coerce
    .number()
    .min(1, "Payment amount must be greater than 0"),
  date: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  receivedFromContactId: z.string().optional(),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
  fileName: z.string().optional(),
});

type IncomePaymentFormValues = z.infer<typeof incomePaymentSchema>;

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultValues(
  receivedBy: string,
  paymentSource?: IncomeTransaction | null,
  paymentAmountMinorUnits?: string | null,
): IncomePaymentFormValues {
  return {
    amountMinorUnits: Number(paymentAmountMinorUnits ?? 0),
    date: formatDateInput(new Date()),
    paymentMethod: paymentSource?.paymentMethod || "CASH",
    receivedFromContactId: paymentSource?.receivedFromContactId || "",
    receivedBy,
    notes: "",
    fileName: "",
  };
}

export function IncomePaymentDialog({
  open,
  onOpenChange,
  family,
  currentUser,
  contacts,
  paymentSource,
  paymentAmountMinorUnits,
  onContactsChanged,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  currentUser: CurrentUser | null;
  contacts: FamilyContact[];
  paymentSource: IncomeTransaction | null;
  paymentAmountMinorUnits: string | null;
  onContactsChanged: (contact?: FamilyContact) => void | Promise<void>;
  onSuccess: () => void;
}) {
  const [openCreatePayer, setOpenCreatePayer] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [isCreatingPayer, setIsCreatingPayer] = useState(false);
  const [payerCreateError, setPayerCreateError] = useState<string | null>(null);
  const hasPaymentSource = Boolean(paymentSource?.id);
  const missingPaymentSourceMessage =
    "Choose an every-time income record before recording a payment.";
  const defaultReceivedBy =
    family.members.find((member) => member.userId === currentUser?.id)
      ?.fullName ??
    currentUser?.fullName ??
    "";
  const activeContacts = contacts.filter(
    (contact) => contact.status === "ACTIVE",
  );
  const payerOptions = activeContacts.map((contact) => ({
    label: contact.phoneNumber
      ? `${contact.fullName} (${contact.phoneNumber})`
      : contact.fullName,
    value: contact.id,
  }));

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    IncomePaymentFormValues,
    IncomeTransaction
  >({
    schema: incomePaymentSchema,
    formOptions: {
      defaultValues: getDefaultValues(
        defaultReceivedBy,
        paymentSource,
        paymentAmountMinorUnits,
      ),
    },
    transform: (values) => ({
      amountMinorUnits: String(values.amountMinorUnits),
      date: new Date(values.date).toISOString(),
      paymentMethod: values.paymentMethod,
      receivedFromContactId: values.receivedFromContactId || undefined,
      receivedBy: values.receivedBy,
      notes: values.notes,
      idempotencyKey: `record-income-payment-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
    }),
    request: {
      method: "post",
      url: () =>
        `/families/${encodeURIComponent(
          family.id,
        )}/money/transactions/${encodeURIComponent(
          paymentSource?.id ?? "",
        )}/payments`,
    },
    onSuccessMessage: "Income payment recorded successfully",
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
      form.reset(getDefaultValues(defaultReceivedBy));
      onSuccess();
    },
  });

  const handleCreatePayer = async () => {
    const fullName = payerName.trim();
    if (!fullName) {
      setPayerCreateError("Payer name is required.");
      return;
    }

    try {
      setIsCreatingPayer(true);
      setPayerCreateError(null);

      const response = await apiRequest<unknown, FamilyContact>(
        "post",
        `/families/${encodeURIComponent(family.id)}/contacts`,
        {
          fullName,
          contactType: "OTHER",
          phoneNumber: payerPhone.trim() || null,
          relationshipToFamily: "Income payer",
          notes: "Created from recurring income payment payer field.",
          status: "ACTIVE",
          isEmergencyContact: false,
          isLoanContact: false,
        },
      );

      if (!response.ok || !response.data) {
        setPayerCreateError(
          response.message ?? "Could not create payer contact.",
        );
        return;
      }

      await onContactsChanged(response.data);
      form.setValue("receivedFromContactId", response.data.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setPayerName("");
      setPayerPhone("");
      setOpenCreatePayer(false);
    } catch {
      setPayerCreateError("Could not create payer contact.");
    } finally {
      setIsCreatingPayer(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    form.reset(
      getDefaultValues(
        defaultReceivedBy,
        paymentSource,
        paymentAmountMinorUnits,
      ),
    );
  }, [defaultReceivedBy, form, open, paymentAmountMinorUnits, paymentSource]);

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
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Save only the money received now. The monthly income setup stays the
            same.
          </DialogDescription>
        </DialogHeader>

        {paymentSource ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <div className="font-medium">
              {paymentSource.propertyName ||
                paymentSource.description ||
                paymentSource.category.name}
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Payer: </span>
                <span className="font-medium">
                  {paymentSource.receivedFrom ?? "Not recorded"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Category: </span>
                <span className="font-medium">
                  {paymentSource.category.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Expected: </span>
                <span className="font-medium">
                  <CompactMoney
                    currency={family.defaultCurrency}
                    value={paymentSource.expectedAmountMinorUnits ?? "0"}
                  />
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Left now: </span>
                <span className="font-medium">
                  <CompactMoney
                    currency={family.defaultCurrency}
                    value={paymentAmountMinorUnits ?? "0"}
                  />
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Due date: </span>
                <span className="font-medium">
                  {paymentSource.dueDate
                    ? formatDate(paymentSource.dueDate)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {!hasPaymentSource ? (
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Payment source missing</AlertTitle>
            <AlertDescription>{missingPaymentSourceMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form
          id="income-payment-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-4"
        >
          {error ? (
            <div className="font-medium text-destructive text-sm">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="amountMinorUnits"
              label={`Amount paid now (${family.defaultCurrency})`}
              fieldType="money"
              currency={family.defaultCurrency}
              placeholder="e.g. 150,000"
              description="Enter only what was paid now."
              required
            />

            <CommonFormField
              control={form.control}
              name="date"
              label="Payment date"
              fieldType="date"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              placeholder="Select payment method"
              required
            />

            <CommonFormField
              control={form.control}
              name="receivedBy"
              label="Received by"
              fieldType="select"
              selectOptions={family.members.map((member) => ({
                label: member.fullName,
                value: member.fullName,
              }))}
              placeholder="Select member"
            />
          </div>

          <CommonFormField
            control={form.control}
            name="receivedFromContactId"
            label="Person who paid"
            fieldType="custom"
            placeholder={
              activeContacts.length === 0
                ? "Create payer contact"
                : "Select payer contact"
            }
            description="Defaults to the last payer saved on this recurring income."
            render={({ field, id, invalid, disabled }) => (
              <>
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    if (value === CREATE_PAYER_CONTACT_VALUE) {
                      setOpenCreatePayer(true);
                      return;
                    }

                    field.onChange(value);
                  }}
                  disabled={disabled}
                  name={field.name}
                >
                  <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={invalid}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue
                      placeholder={
                        activeContacts.length === 0
                          ? "Create payer contact"
                          : "Select payer contact"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {payerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value={CREATE_PAYER_CONTACT_VALUE}>
                        {activeContacts.length === 0
                          ? "Create payer contact"
                          : "Create another payer contact"}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Dialog
                  open={openCreatePayer}
                  onOpenChange={(isOpen) => {
                    setOpenCreatePayer(isOpen);
                    if (!isOpen) setPayerCreateError(null);
                  }}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create payer contact</DialogTitle>
                      <DialogDescription>
                        Save the person who paid, then use them on this payment.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                      {payerCreateError ? (
                        <div className="font-medium text-destructive text-sm">
                          {payerCreateError}
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="payment-payer-contact-name"
                          className="font-medium text-sm"
                        >
                          Payer name
                        </label>
                        <Input
                          id="payment-payer-contact-name"
                          value={payerName}
                          onChange={(event) => setPayerName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreatePayer();
                            }
                          }}
                          placeholder="e.g. Jean Tenant"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="payment-payer-contact-phone"
                          className="font-medium text-sm"
                        >
                          Phone number
                        </label>
                        <Input
                          id="payment-payer-contact-phone"
                          value={payerPhone}
                          onChange={(event) =>
                            setPayerPhone(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreatePayer();
                            }
                          }}
                          placeholder="+250 788 000 000"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        onClick={handleCreatePayer}
                        disabled={isCreatingPayer}
                        className="w-full"
                      >
                        {isCreatingPayer ? "Saving..." : "Save payer contact"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          />

          <CommonFormField
            control={form.control}
            name="notes"
            label="Payment note"
            fieldType="textarea"
            placeholder="e.g. Paid before due date, balance will come later"
          />

          <CommonFormField
            control={form.control}
            name="fileName"
            label="Receipt/Proof (Mock Upload)"
            type="file"
            description="Upload proof of this payment"
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="income-payment-form"
            disabled={isPending || !hasPaymentSource}
            className="w-full"
            title={!hasPaymentSource ? missingPaymentSourceMessage : undefined}
          >
            {isPending ? "Recording..." : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
