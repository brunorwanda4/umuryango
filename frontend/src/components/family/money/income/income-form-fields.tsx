"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
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
import apiRequest from "@/service/api";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import { formatDate, formatMinorUnits } from "../utils";
import type {
  Category,
  IncomeTransaction,
  TransactionFormValues,
} from "./types-and-schemas";

const CREATE_INCOME_CATEGORY_VALUE = "__create_income_category__";
const CREATE_PAYER_CONTACT_VALUE = "__create_payer_contact__";
const DEFAULT_RENT_PERIOD_YEARS = 2;

type IncomeFormFieldsProps = {
  control: Control<TransactionFormValues>;
  family: FamilyDetail;
  categories: Category[];
  contacts: FamilyContact[];
  setValue: UseFormSetValue<TransactionFormValues>;
  onCategoriesChanged?: (category?: Category) => void | Promise<void>;
  onContactsChanged?: (contact?: FamilyContact) => void | Promise<void>;
  isPaymentMode?: boolean;
  paymentSource?: IncomeTransaction | null;
  paymentAmountMinorUnits?: string | null;
  /** Show the mock receipt/proof upload field. Only needed on the create dialog. */
  showReceiptUpload?: boolean;
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function addYears(date: Date, years: number) {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
}

/**
 * Shared field layout for both Create and Edit income dialogs.
 *
 * Render this inside a <form> with:
 *   className="flex flex-col gap-4"
 *
 * Set showReceiptUpload={true} on create so the receipt field appears.
 */
export function IncomeFormFields({
  control,
  family,
  categories,
  contacts,
  setValue,
  onCategoriesChanged,
  onContactsChanged,
  isPaymentMode = false,
  paymentSource,
  paymentAmountMinorUnits,
  showReceiptUpload = false,
}: IncomeFormFieldsProps) {
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [openCreatePayer, setOpenCreatePayer] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [isCreatingPayer, setIsCreatingPayer] = useState(false);
  const [payerCreateError, setPayerCreateError] = useState<string | null>(null);
  const incomeRecurrence = useWatch({
    control,
    name: "incomeRecurrence",
  });
  const receivedDate = useWatch({
    control,
    name: "date",
  });
  const dueDate = useWatch({
    control,
    name: "dueDate",
  });
  const periodStart = useWatch({
    control,
    name: "periodStart",
  });
  const periodEnd = useWatch({
    control,
    name: "periodEnd",
  });
  const canCreateCategoryInline = Boolean(onCategoriesChanged);
  const canCreatePayerInline = Boolean(onContactsChanged);
  const activeContacts = contacts.filter(
    (contact) => contact.status === "ACTIVE",
  );
  const categoryOptions = [
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
    ...(canCreateCategoryInline
      ? [
          {
            label:
              categories.length === 0
                ? "Other / create income category"
                : "Create another income category",
            value: CREATE_INCOME_CATEGORY_VALUE,
          },
        ]
      : []),
  ];
  const payerOptions = [
    ...activeContacts.map((contact) => ({
      label: contact.phoneNumber
        ? `${contact.fullName} (${contact.phoneNumber})`
        : contact.fullName,
      name: contact.fullName,
      value: contact.id,
    })),
    ...(canCreatePayerInline
      ? [
          {
            label:
              activeContacts.length === 0
                ? "Create payer contact"
                : "Create another payer contact",
            name: "",
            value: CREATE_PAYER_CONTACT_VALUE,
          },
        ]
      : []),
  ];

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
          notes:
            incomeRecurrence === "MONTHLY"
              ? "Created from monthly income rent payer field."
              : "Created from income payer field.",
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

      await onContactsChanged?.(response.data);
      setValue("receivedFromContactId", response.data.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("receivedFrom", response.data.fullName, {
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
    if (incomeRecurrence !== "MONTHLY") return;

    const todayInput = formatDateInput(new Date());
    const startInput = periodStart || receivedDate || todayInput;
    const endInput = formatDateInput(
      addYears(parseDateInput(startInput), DEFAULT_RENT_PERIOD_YEARS),
    );

    if (!dueDate) {
      setValue("dueDate", startInput, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }

    if (!periodStart) {
      setValue("periodStart", startInput, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }

    if (!periodEnd) {
      setValue("periodEnd", endInput, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [
    dueDate,
    incomeRecurrence,
    periodEnd,
    periodStart,
    receivedDate,
    setValue,
  ]);

  return (
    <>
      {isPaymentMode ? null : (
        <CommonFormField
          control={control}
          name="title"
          label="Income title"
          placeholder="e.g. June Salary"
          required
        />
      )}

      {isPaymentMode && paymentAmountMinorUnits ? (
        <div className="rounded-md border bg-muted/30 p-4">
          <h3 className="text-sm font-medium">
            Record money received for{" "}
            {paymentSource?.propertyName ||
              paymentSource?.description ||
              paymentSource?.category.name ||
              "monthly income"}
          </h3>
          <p className="mt-1 text-muted-foreground text-xs">
            Enter only the amount the payer gave you today. Current unpaid
            balance before this payment is{" "}
            {formatMinorUnits(paymentAmountMinorUnits, family.defaultCurrency)}.
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Category: </span>
              <span className="font-medium">
                {paymentSource?.category.name ?? "Recurring income"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Payer: </span>
              <span className="font-medium">
                {paymentSource?.receivedFrom ?? "Not recorded"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Expected: </span>
              <span className="font-medium">
                {formatMinorUnits(
                  paymentSource?.expectedAmountMinorUnits ?? "0",
                  family.defaultCurrency,
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Due date: </span>
              <span className="font-medium">
                {paymentSource?.dueDate
                  ? formatDate(paymentSource.dueDate)
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={
            isPaymentMode
              ? `Amount paid now (${family.defaultCurrency})`
              : incomeRecurrence === "MONTHLY"
                ? `Amount paid (${family.defaultCurrency})`
                : `Amount (${family.defaultCurrency})`
          }
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder={isPaymentMode ? "e.g. 150,000" : "e.g. 500,000"}
          description={
            isPaymentMode && paymentAmountMinorUnits
              ? "Write only the money received now, not the full monthly amount and not the remaining balance."
              : undefined
          }
          required
        />

        <CommonFormField
          control={control}
          name="date"
          label={isPaymentMode ? "Payment date" : "Date received"}
          fieldType="date"
          required
        />
      </div>

      {isPaymentMode ? null : (
        <CommonFormField
          control={control}
          name="incomeRecurrence"
          label="Income schedule"
          fieldType="select"
          selectOptions={[
            { label: "One-time income", value: "ONE_TIME" },
            { label: "Monthly rent or recurring income", value: "MONTHLY" },
          ]}
          placeholder="Select income schedule"
          required
        />
      )}

      {incomeRecurrence === "MONTHLY" && !isPaymentMode ? (
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Monthly rent tracking</h3>
            <p className="text-xs text-muted-foreground">
              Track what was expected, what was paid, what remains, and when it
              was due. New records default to a 2-year payment period starting
              today.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={control}
              name="expectedAmountMinorUnits"
              label={`Expected amount (${family.defaultCurrency})`}
              fieldType="money"
              currency={family.defaultCurrency}
              placeholder="e.g. 300,000"
              required
            />

            <CommonFormField
              control={control}
              name="dueDate"
              label="Due date"
              fieldType="date"
              required
            />

            <CommonFormField
              control={control}
              name="periodStart"
              label="Period start"
              fieldType="date"
            />

            <CommonFormField
              control={control}
              name="periodEnd"
              label="Period end"
              fieldType="date"
            />
          </div>

          <CommonFormField
            control={control}
            name="propertyName"
            label="House or unit"
            placeholder="e.g. Kigali house, Room 2"
            fieldClassName="mt-4"
          />
        </div>
      ) : null}

      <div
        className={
          isPaymentMode ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"
        }
      >
        {isPaymentMode ? null : (
          <CommonFormField
            control={control}
            name="categoryId"
            label="Category"
            fieldType="custom"
            disabled={categories.length === 0 && !canCreateCategoryInline}
            placeholder={
              categories.length === 0
                ? "Select other category"
                : "Select Category"
            }
            required
            render={({ field, id, invalid, disabled }) => (
              <>
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    if (value === CREATE_INCOME_CATEGORY_VALUE) {
                      setOpenCreateCategory(true);
                      field.onChange("");
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
                        categories.length === 0
                          ? "Select other category"
                          : "Select Category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {canCreateCategoryInline ? (
                  <CreateCategoryForm
                    defaultType="INCOME"
                    existingCategories={categories.map((category) => ({
                      id: category.id,
                      name: category.name,
                      type: "INCOME" as const,
                    }))}
                    familyId={family.id}
                    open={openCreateCategory}
                    onOpenChange={setOpenCreateCategory}
                    onSuccess={async (category) => {
                      await onCategoriesChanged?.(category);

                      if (category?.id && category.type === "INCOME") {
                        field.onChange(category.id);
                      }
                    }}
                    trigger={null}
                  />
                ) : null}
              </>
            )}
            description={
              categories.length === 0 ? (
                <span
                  className={
                    canCreateCategoryInline
                      ? "text-muted-foreground text-xs mt-1 block"
                      : "text-destructive font-medium text-xs mt-1 block"
                  }
                >
                  {canCreateCategoryInline ? (
                    <>
                      Select "Other / create income category" to add one here,
                      or{" "}
                      <Link
                        href={`/family/${family.slug}/money/categories`}
                        className="underline hover:opacity-80 font-semibold"
                      >
                        manage categories
                      </Link>{" "}
                      on the categories page.
                    </>
                  ) : (
                    <>
                      Please{" "}
                      <Link
                        href={`/family/${family.slug}/money/categories`}
                        className="underline hover:opacity-80 font-semibold"
                      >
                        create a category of income
                      </Link>{" "}
                      first.
                    </>
                  )}
                </span>
              ) : undefined
            }
          />
        )}

        <CommonFormField
          control={control}
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

      <div
        className={
          isPaymentMode ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"
        }
      >
        {isPaymentMode ? null : (
          <CommonFormField
            control={control}
            name="receivedFromContactId"
            label={
              incomeRecurrence === "MONTHLY" ? "Tenant / payer" : "Paid by"
            }
            fieldType="custom"
            placeholder={
              activeContacts.length === 0
                ? "Create payer contact"
                : "Select payer contact"
            }
            render={({ field, id, invalid, disabled }) => (
              <>
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(value) => {
                    if (value === CREATE_PAYER_CONTACT_VALUE) {
                      setOpenCreatePayer(true);
                      return;
                    }

                    const selectedContact = activeContacts.find(
                      (contact) => contact.id === value,
                    );

                    field.onChange(value);
                    setValue("receivedFrom", selectedContact?.fullName ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
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
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {canCreatePayerInline ? (
                  <Dialog
                    open={openCreatePayer}
                    onOpenChange={(open) => {
                      setOpenCreatePayer(open);
                      if (!open) setPayerCreateError(null);
                    }}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create payer contact</DialogTitle>
                        <DialogDescription>
                          Save the tenant or person who pays this income, then
                          use them on the income record.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col gap-4 py-4">
                        {payerCreateError ? (
                          <div className="text-sm font-medium text-destructive">
                            {payerCreateError}
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="payer-contact-name"
                            className="text-sm font-medium"
                          >
                            Payer name
                          </label>
                          <Input
                            id="payer-contact-name"
                            value={payerName}
                            onChange={(event) =>
                              setPayerName(event.target.value)
                            }
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
                            htmlFor="payer-contact-phone"
                            className="text-sm font-medium"
                          >
                            Phone number
                          </label>
                          <Input
                            id="payer-contact-phone"
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
                ) : null}
              </>
            )}
          />
        )}

        <CommonFormField
          control={control}
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
        control={control}
        name="notes"
        label="Notes"
        fieldType="textarea"
        placeholder="Optional additional notes"
      />

      {showReceiptUpload && isPaymentMode ? (
        <CommonFormField
          control={control}
          name="fileName"
          label="Receipt/Proof (Mock Upload)"
          type="file"
          description="Upload proof of payment"
        />
      ) : showReceiptUpload ? (
        <div className="grid grid-cols-2 gap-4">
          <CommonFormField
            control={control}
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
            control={control}
            name="fileName"
            label="Receipt/Proof (Mock Upload)"
            type="file"
            description="Upload proof of payment"
          />
        </div>
      ) : (
        <CommonFormField
          control={control}
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
      )}
    </>
  );
}
