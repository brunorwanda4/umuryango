"use client";

import Link from "next/link";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { CreateCategoryForm } from "@/components/family/money/forms/create-category-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Category,
  type ExpenseFormValues,
  type ExpenseLinkOptions,
  expenseStatuses,
  paymentMethods,
} from "./types-and-schemas";

const CREATE_EXPENSE_CATEGORY_VALUE = "__create_expense_category__";

type ExpenseFormFieldsProps = {
  control: Control<ExpenseFormValues>;
  family: FamilyDetail;
  categories: Category[];
  linkOptions: ExpenseLinkOptions;
  onCategoriesChanged?: (category?: Category) => void | Promise<void>;
  showReceiptUpload?: boolean;
};

export function ExpenseFormFields({
  control,
  family,
  categories,
  linkOptions,
  onCategoriesChanged,
  showReceiptUpload = false,
}: ExpenseFormFieldsProps) {
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const canCreateCategoryInline = Boolean(onCategoriesChanged);
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
                ? "Other / create expense category"
                : "Create another expense category",
            value: CREATE_EXPENSE_CATEGORY_VALUE,
          },
        ]
      : []),
  ];

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
          fieldType="custom"
          disabled={categories.length === 0 && !canCreateCategoryInline}
          placeholder={
            categories.length === 0
              ? "Select other category"
              : "Select expense category"
          }
          required
          render={({ field, id, invalid, disabled }) => (
            <>
              <Select
                value={field.value?.toString() ?? ""}
                onValueChange={(value) => {
                  if (value === CREATE_EXPENSE_CATEGORY_VALUE) {
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
                        : "Select expense category"
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
                  defaultType="EXPENSE"
                  existingCategories={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                    type: "EXPENSE" as const,
                  }))}
                  familyId={family.id}
                  open={openCreateCategory}
                  onOpenChange={setOpenCreateCategory}
                  onSuccess={async (category) => {
                    await onCategoriesChanged?.(category);

                    if (category?.id && category.type === "EXPENSE") {
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
                    ? "mt-1 block text-muted-foreground text-xs"
                    : "mt-1 block font-medium text-destructive text-xs"
                }
              >
                {canCreateCategoryInline ? (
                  <>
                    Select "Other / create expense category" to add one here, or{" "}
                    <Link
                      href={`/family/${family.slug}/money/categories`}
                      className="font-semibold underline hover:opacity-80"
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
                      className="font-semibold underline hover:opacity-80"
                    >
                      create an expense category
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
