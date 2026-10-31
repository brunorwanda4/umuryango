"use client";

import { PencilIcon } from "lucide-react";
import type * as React from "react";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import type {
  ExpenseCategory,
  RecentExpenseRecord,
} from "./expense-dashboard-data";

type UpdateExpenseDialogProps = {
  expense: RecentExpenseRecord;
  categories: ExpenseCategory[];
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement | null;
};

export function UpdateExpenseDialog({
  categories,
  familyId,
  expense,
  onOpenChange,
  onSuccess,
  open,
  trigger,
}: UpdateExpenseDialogProps) {
  const t = createTranslator("PersonalMoney.personalExpenses");

  return (
    <MoneyFormDialog
      type="expense"
      mode="update"
      categories={categories}
      familyId={familyId}
      incomeId={expense.id}
      open={open}
      onOpenChange={onOpenChange}
      onCategoryCreated={onSuccess}
      onSuccess={onSuccess}
      defaultValues={{
        title: expense.source,
        amountMinorUnits: Number(expense.amountMinorUnits),
        categoryId: expense.categoryId,
        date: expense.dateValue,
        account: expense.account,
        notes: expense.notes,
      }}
      trigger={
        trigger === undefined ? (
          <Button
            className="justify-start"
            size="sm"
            type="button"
            variant="ghost"
          >
            <PencilIcon aria-hidden="true" data-icon="inline-start" />
            {t("actions.edit")}
          </Button>
        ) : (
          trigger
        )
      }
    />
  );
}
