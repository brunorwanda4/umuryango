"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
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
import type { Category, TransactionFormValues } from "./types-and-schemas";

const CREATE_INCOME_CATEGORY_VALUE = "__create_income_category__";
const CREATE_PAYER_CONTACT_VALUE = "__create_payer_contact__";

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

  const handleCreatePayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

  return (
    <>
      <CommonFormField
        control={control}
        name="title"
        label="Income title"
        placeholder="e.g. June Salary"
        required
      />

      <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={
            incomeRecurrence === "MONTHLY"
              ? `Amount paid (${family.defaultCurrency})`
              : `Amount (${family.defaultCurrency})`
          }
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder="e.g. 500,000"
          required
        />

        <CommonFormField
          control={control}
          name="date"
          label="Date received"
          fieldType="date"
          required
        />
      </div>

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

      {incomeRecurrence === "MONTHLY" ? (
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Monthly rent tracking</h3>
            <p className="text-xs text-muted-foreground">
              Track what was expected, what was paid, what remains, and when it
              was due.
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

      <div className="grid grid-cols-2 gap-4">
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
                    Select "Other / create income category" to add one here, or{" "}
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

      <div className="grid grid-cols-2 gap-4">
        <CommonFormField
          control={control}
          name="receivedFromContactId"
          label={incomeRecurrence === "MONTHLY" ? "Tenant / payer" : "Paid by"}
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
                        Save the tenant or person who pays this income, then use
                        them on the income record.
                      </DialogDescription>
                    </DialogHeader>

                    <form
                      id="create-payer-contact-form"
                      onSubmit={handleCreatePayer}
                      className="flex flex-col gap-4 py-4"
                    >
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
                          onChange={(event) => setPayerName(event.target.value)}
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
                          placeholder="+250 788 000 000"
                        />
                      </div>
                    </form>

                    <DialogFooter>
                      <Button
                        type="submit"
                        form="create-payer-contact-form"
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

      {showReceiptUpload ? (
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
