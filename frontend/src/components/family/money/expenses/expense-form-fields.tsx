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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyExpenses");
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
                ? t("form.otherCreateCategory")
                : t("form.createAnotherCategory"),
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
        label={t("form.titleLabel")}
        placeholder={t("form.titlePlaceholder")}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="amountMinorUnits"
          label={t("form.amountLabel", { currency: family.defaultCurrency })}
          fieldType="money"
          currency={family.defaultCurrency}
          placeholder={t("form.amountPlaceholder")}
          required
        />
        <CommonFormField
          control={control}
          name="date"
          label={t("form.dateLabel")}
          fieldType="date"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="categoryId"
          label={t("form.categoryLabel")}
          fieldType="custom"
          disabled={categories.length === 0 && !canCreateCategoryInline}
          placeholder={
            categories.length === 0
              ? t("form.selectOtherCategoryPlaceholder")
              : t("form.selectCategoryPlaceholder")
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
                        ? t("form.selectOtherCategoryPlaceholder")
                        : t("form.selectCategoryPlaceholder")
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
                    {t("form.inlinePromptPrefix")}
                    <Link
                      href={`/family/${family.slug}/money/categories`}
                      className="font-semibold underline hover:opacity-80"
                    >
                      {t("form.manageCategoriesLink")}
                    </Link>
                    {t("form.inlinePromptSuffix")}
                  </>
                ) : (
                  <>
                    {t("form.firstPromptPrefix")}
                    <Link
                      href={`/family/${family.slug}/money/categories`}
                      className="font-semibold underline hover:opacity-80"
                    >
                      {t("form.createCategoryLink")}
                    </Link>
                    {t("form.firstPromptSuffix")}
                  </>
                )}
              </span>
            ) : undefined
          }
        />
        <CommonFormField
          control={control}
          name="paymentMethod"
          label={t("form.paymentMethodLabel")}
          fieldType="select"
          selectOptions={paymentMethods}
          placeholder={t("form.selectPaymentMethod")}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="paidTo"
          label={t("form.paidToLabel")}
          placeholder={t("form.paidToPlaceholder")}
        />
        <CommonFormField
          control={control}
          name="paidBy"
          label={t("form.paidByLabel")}
          fieldType="select"
          selectOptions={family.members.map((member) => ({
            label: member.fullName,
            value: member.fullName,
          }))}
          placeholder={t("form.selectFamilyMember")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="budgetId"
          label={t("form.budgetLabel")}
          fieldType="select"
          selectOptions={[
            { label: t("form.noBudget"), value: "none" },
            ...linkOptions.budgets.map((budget) => ({
              label: budget.categoryName,
              value: budget.id ?? budget.categoryName,
            })),
          ]}
          placeholder={t("form.optionalBudget")}
        />
        <CommonFormField
          control={control}
          name="projectId"
          label={t("form.projectLabel")}
          fieldType="select"
          selectOptions={[
            { label: t("form.noProject"), value: "none" },
            ...linkOptions.projects.map((project) => ({
              label: project.name,
              value: project.id,
            })),
          ]}
          placeholder={t("form.optionalProject")}
        />
      </div>

      <CommonFormField
        control={control}
        name="notes"
        label={t("form.notesLabel")}
        fieldType="textarea"
        placeholder={t("form.notesPlaceholder")}
        textareaProps={{ rows: 4 }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CommonFormField
          control={control}
          name="status"
          label={t("form.statusLabel")}
          fieldType="select"
          selectOptions={expenseStatuses}
          required
        />
        {showReceiptUpload ? (
          <CommonFormField
            control={control}
            name="fileName"
            label={t("form.receiptUploadLabel")}
            type="file"
            description={t("form.receiptUploadDesc")}
          />
        ) : null}
      </div>
    </>
  );
}
