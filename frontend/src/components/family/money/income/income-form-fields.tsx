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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import type { FamilyContact } from "../../contacts/types-and-schemas";
import type { Category, TransactionFormValues } from "./types-and-schemas";

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
  showReceiptUpload = false,
}: IncomeFormFieldsProps) {
  const t = createTranslator("FamilyIncome");
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
                ? t((m) => m.FamilyIncome.form.otherCreateCategory)
                : t((m) => m.FamilyIncome.form.createAnotherCategory),
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
                ? t((m) => m.FamilyIncome.form.payerPlaceholderCreate)
                : t("form.createAnotherPayer"),
            name: "",
            value: CREATE_PAYER_CONTACT_VALUE,
          },
        ]
      : []),
  ];

  const handleCreatePayer = async () => {
    const fullName = payerName.trim();
    if (!fullName) {
      setPayerCreateError(t((m) => m.FamilyIncome.form.payerRequired));
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
          response.message ?? t((m) => m.FamilyIncome.form.payerError),
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
      setPayerCreateError(t((m) => m.FamilyIncome.form.payerError));
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
      <CommonFormField
        control={control}
        name="title"
        label={t((m) => m.FamilyIncome.form.titleLabel)}
        placeholder={t((m) => m.FamilyIncome.form.titlePlaceholder)}
        required
      />

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={
            incomeRecurrence === "MONTHLY"
              ? t((m) => m.FamilyIncome.form.amountLabelPaid, {
                  currency: family.defaultCurrency,
                })
              : t((m) => m.FamilyIncome.form.amountLabel, {
                  currency: family.defaultCurrency,
                })
          }
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder={t((m) => m.FamilyIncome.form.amountPlaceholder)}
          required
        />

        <CommonFormField
          control={control}
          name="date"
          label={t((m) => m.FamilyIncome.form.dateReceivedLabel)}
          fieldType="date"
          required
        />
      </div>

      <CommonFormField
        control={control}
        name="incomeRecurrence"
        label={t((m) => m.FamilyIncome.form.scheduleLabel)}
        fieldType="select"
        selectOptions={[
          {
            label: t((m) => m.FamilyIncome.form.oneTimeSchedule),
            value: "ONE_TIME",
          },
          {
            label: t((m) => m.FamilyIncome.form.monthlySchedule),
            value: "MONTHLY",
          },
        ]}
        placeholder={t((m) => m.FamilyIncome.form.schedulePlaceholder)}
        required
      />

      {incomeRecurrence === "MONTHLY" ? (
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">
              {t((m) => m.FamilyIncome.form.monthlyTrackingTitle)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t((m) => m.FamilyIncome.form.monthlyTrackingDesc)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={control}
              name="expectedAmountMinorUnits"
              label={t((m) => m.FamilyIncome.form.expectedAmountLabel, {
                currency: family.defaultCurrency,
              })}
              fieldType="money"
              currency={family.defaultCurrency}
              placeholder={t(
                (m) => m.FamilyIncome.form.expectedAmountPlaceholder,
              )}
              required
            />

            <CommonFormField
              control={control}
              name="dueDate"
              label={t((m) => m.FamilyIncome.form.dueDateLabel)}
              fieldType="date"
              required
            />

            <CommonFormField
              control={control}
              name="periodStart"
              label={t((m) => m.FamilyIncome.form.periodStartLabel)}
              fieldType="date"
            />

            <CommonFormField
              control={control}
              name="periodEnd"
              label={t((m) => m.FamilyIncome.form.periodEndLabel)}
              fieldType="date"
            />
          </div>

          <CommonFormField
            control={control}
            name="propertyName"
            label={t((m) => m.FamilyIncome.form.propertyNameLabel)}
            placeholder={t((m) => m.FamilyIncome.form.propertyNamePlaceholder)}
            fieldClassName="mt-4"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <CommonFormField
          control={control}
          name="categoryId"
          label={t((m) => m.FamilyIncome.form.categoryLabel)}
          fieldType="custom"
          disabled={categories.length === 0 && !canCreateCategoryInline}
          placeholder={
            categories.length === 0
              ? t((m) => m.FamilyIncome.form.categoryPlaceholderOther)
              : t((m) => m.FamilyIncome.form.categoryPlaceholder)
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
                        ? t((m) => m.FamilyIncome.form.categoryPlaceholderOther)
                        : t((m) => m.FamilyIncome.form.categoryPlaceholder)
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
                    Select "Other / create income category" to add one here, or{" "}
                    <Link
                      href={`/family/${family.slug}/money/categories`}
                      className="underline hover:opacity-80 font-semibold"
                    >
                      {t((m) => m.FamilyIncome.form.manageCategoriesLink)}
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
                      {t((m) => m.FamilyIncome.form.createCategoryLink)}
                    </Link>{" "}
                    first.
                  </>
                )}
              </span>
            ) : undefined
          }
        />

        <CommonFormField
          control={control}
          name="paymentMethod"
          label={t((m) => m.FamilyIncome.form.paymentMethodLabel)}
          fieldType="select"
          selectOptions={[
            { label: "Cash", value: "CASH" },
            { label: "Mobile Money", value: "MOBILE_MONEY" },
            { label: "Bank Transfer", value: "BANK_TRANSFER" },
            { label: "Card", value: "CARD" },
            { label: "Cheque", value: "CHEQUE" },
            { label: "Other", value: "OTHER" },
          ]}
          placeholder={t((m) => m.FamilyIncome.form.paymentMethodPlaceholder)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CommonFormField
          control={control}
          name="receivedFromContactId"
          label={
            incomeRecurrence === "MONTHLY"
              ? t((m) => m.FamilyIncome.form.tenantPayerLabel)
              : t((m) => m.FamilyIncome.form.paidByLabel)
          }
          fieldType="custom"
          placeholder={
            activeContacts.length === 0
              ? t((m) => m.FamilyIncome.form.payerPlaceholderCreate)
              : t((m) => m.FamilyIncome.form.payerPlaceholder)
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
                        ? t((m) => m.FamilyIncome.form.payerPlaceholderCreate)
                        : t((m) => m.FamilyIncome.form.payerPlaceholder)
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
                      <DialogTitle>
                        {t((m) => m.FamilyIncome.form.createPayerTitle)}
                      </DialogTitle>
                      <DialogDescription>
                        {t((m) => m.FamilyIncome.form.createPayerDesc)}
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
                          {t((m) => m.FamilyIncome.form.payerNameLabel)}
                        </label>
                        <Input
                          id="payer-contact-name"
                          value={payerName}
                          onChange={(event) => setPayerName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreatePayer();
                            }
                          }}
                          placeholder={t(
                            (m) => m.FamilyIncome.form.payerNamePlaceholder,
                          )}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="payer-contact-phone"
                          className="text-sm font-medium"
                        >
                          {t((m) => m.FamilyIncome.form.payerPhoneLabel)}
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
                          placeholder={t(
                            (m) => m.FamilyIncome.form.payerPhonePlaceholder,
                          )}
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
                        {isCreatingPayer
                          ? t((m) => m.FamilyIncome.form.savingPayer)
                          : t((m) => m.FamilyIncome.form.savePayer)}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </>
          )}
        />

        <CommonFormField
          control={control}
          name="receivedBy"
          label={t((m) => m.FamilyIncome.form.receivedByLabel)}
          fieldType="select"
          selectOptions={family.members.map((m) => ({
            label: m.fullName,
            value: m.fullName,
          }))}
          placeholder={t((m) => m.FamilyIncome.form.receivedByPlaceholder)}
        />
      </div>

      <CommonFormField
        control={control}
        name="notes"
        label={t((m) => m.FamilyIncome.form.notesLabel)}
        fieldType="textarea"
        placeholder={t((m) => m.FamilyIncome.form.notesPlaceholder)}
      />

      {showReceiptUpload ? (
        <div className="grid grid-cols-2 gap-4">
          <CommonFormField
            control={control}
            name="status"
            label={t((m) => m.FamilyIncome.form.statusLabel)}
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
            label={t((m) => m.FamilyIncome.form.receiptLabel)}
            type="file"
            description={t((m) => m.FamilyIncome.form.receiptDesc)}
          />
        </div>
      ) : (
        <CommonFormField
          control={control}
          name="status"
          label={t((m) => m.FamilyIncome.form.statusLabel)}
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
