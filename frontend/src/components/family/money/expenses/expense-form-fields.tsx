"use client";

import Link from "next/link";
import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  type Category,
  type ExpenseFormValues,
  type ExpenseLinkOptions,
  expenseStatuses,
  paymentMethods,
} from "./types-and-schemas";

type ExpenseFormFieldsProps = {
  control: Control<ExpenseFormValues>;
  family: FamilyDetail;
  categories: Category[];
  linkOptions: ExpenseLinkOptions;
  showReceiptUpload?: boolean;
};

export function ExpenseFormFields({
  control,
  family,
  categories,
  linkOptions,
  showReceiptUpload = false,
}: ExpenseFormFieldsProps) {
  return (
    <>
      <CommonFormField
        control={control}
        name="title"
        label="Expense title"
        placeholder="e.g. Monthly groceries"
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={`Amount (${family.defaultCurrency})`}
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder="e.g. 45,000"
          required
        />
        <CommonFormField
          control={control}
          name="date"
          label="Expense date"
          fieldType="date"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="categoryId"
          label="Expense category"
          fieldType="select"
          disabled={categories.length === 0}
          selectOptions={categories.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
          placeholder={
            categories.length === 0
              ? "No expense categories available"
              : "Select expense category"
          }
          required
          description={
            categories.length === 0 ? (
              <span className="mt-1 block font-medium text-destructive text-xs">
                Please{" "}
                <Link
                  href={`/family/${family.slug}/money/categories`}
                  className="font-semibold underline hover:opacity-80"
                >
                  create an expense category
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
          selectOptions={paymentMethods}
          placeholder="Select payment method"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="paidTo"
          label="Paid to"
          placeholder="e.g. Kigali Supermarket"
        />
        <CommonFormField
          control={control}
          name="paidBy"
          label="Paid by"
          fieldType="select"
          selectOptions={family.members.map((member) => ({
            label: member.fullName,
            value: member.fullName,
          }))}
          placeholder="Select family member"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="budgetId"
          label="Budget"
          fieldType="select"
          selectOptions={[
            { label: "No budget", value: "none" },
            ...linkOptions.budgets.map((budget) => ({
              label: budget.categoryName,
              value: budget.id ?? budget.categoryName,
            })),
          ]}
          placeholder="Optional budget"
        />
        <CommonFormField
          control={control}
          name="projectId"
          label="Project"
          fieldType="select"
          selectOptions={[
            { label: "No project", value: "none" },
            ...linkOptions.projects.map((project) => ({
              label: project.name,
              value: project.id,
            })),
          ]}
          placeholder="Optional project"
        />
      </div>

      <CommonFormField
        control={control}
        name="notes"
        label="Notes"
        fieldType="textarea"
        placeholder="Add receipt notes, purpose, or approval context"
        textareaProps={{ rows: 4 }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="status"
          label="Status"
          fieldType="select"
          selectOptions={expenseStatuses}
          required
        />
        {showReceiptUpload ? (
          <CommonFormField
            control={control}
            name="fileName"
            label="Receipt upload"
            type="file"
            description="Attach a receipt or proof of payment."
          />
        ) : null}
      </div>
    </>
  );
}
