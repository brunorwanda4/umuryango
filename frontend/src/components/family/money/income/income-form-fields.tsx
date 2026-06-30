"use client";

import Link from "next/link";
import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { Category, TransactionFormValues } from "./types-and-schemas";

type IncomeFormFieldsProps = {
  control: Control<TransactionFormValues>;
  family: FamilyDetail;
  categories: Category[];
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
  showReceiptUpload = false,
}: IncomeFormFieldsProps) {
  return (
    <>
      <CommonFormField
        control={control}
        name="title"
        label="Income title"
        placeholder="e.g. June Salary"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={`Amount (${family.defaultCurrency})`}
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

      <div className="grid grid-cols-2 gap-4">
        <CommonFormField
          control={control}
          name="categoryId"
          label="Category"
          fieldType="select"
          disabled={categories.length === 0}
          selectOptions={categories.map((c) => ({
            label: c.name,
            value: c.id,
          }))}
          placeholder={
            categories.length === 0
              ? "No categories available"
              : "Select Category"
          }
          required
          description={
            categories.length === 0 ? (
              <span className="text-destructive font-medium text-xs mt-1 block">
                Please{" "}
                <Link
                  href={`/family/${family.slug}/money/categories`}
                  className="underline hover:opacity-80 font-semibold"
                >
                  create a category of income
                </Link>{" "}
                first.
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
          name="receivedFrom"
          label="Received from"
          placeholder="e.g. MTN Rwanda"
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
