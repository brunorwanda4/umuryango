"use client";

import type * as React from "react";
import { ViewTransactionDialog } from "@/components/common/money/view-transaction-dialog";
import { createTranslator } from "@/i18n/translate";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import type {
  ExpenseCategory,
  RecentExpenseRecord,
} from "./expense-dashboard-data";
import { UpdateExpenseDialog } from "./update-expense-dialog";

type ViewExpenseDialogProps = {
  expense: RecentExpenseRecord;
  categories: ExpenseCategory[];
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  searchParamValue?: string;
  trigger?: React.ReactElement | null;
};

export function ViewExpenseDialog({
  categories,
  familyId,
  expense,
  onOpenChange,
  onSuccess,
  open,
  searchParamValue,
  trigger,
}: ViewExpenseDialogProps) {
  const t = createTranslator("PersonalMoney.personalExpenses");
  const ExpenseIcon = expense.icon;

  return (
    <ViewTransactionDialog
      amountLabel={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.amountSpent,
      )}
      amountMinorUnits={expense.amountMinorUnits}
      category={expense.category}
      categoryClassName={expense.categoryClassName}
      currency={expense.currency}
      date={expense.date}
      dateLabel={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.dateSpent,
      )}
      deleteLabel={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.deleteExpense,
      )}
      detailsDescription={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.detailsDesc,
      )}
      detailsTitle={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.detailsTitle,
      )}
      description={expense.description}
      leading={
        <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-lg">
          <ExpenseIcon aria-hidden="true" className="size-5" />
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      paymentIcon={expense.paymentIcon}
      paymentMethod={expense.paymentMethod}
      renderDelete={({ onOpenChange: setDeleteOpen, open: deleteOpen }) => (
        <DeleteExpenseDialog
          familyId={familyId}
          expense={expense}
          onOpenChange={setDeleteOpen}
          onSuccess={onSuccess}
          open={deleteOpen}
          trigger={null}
        />
      )}
      renderUpdate={({ onOpenChange: setUpdateOpen, open: updateOpen }) => (
        <UpdateExpenseDialog
          categories={categories}
          familyId={familyId}
          expense={expense}
          onOpenChange={setUpdateOpen}
          onSuccess={onSuccess}
          open={updateOpen}
          trigger={null}
        />
      )}
      searchParamValue={searchParamValue ?? `view-expense-${expense.id}`}
      title={expense.source}
      trigger={trigger}
      updateLabel={t(
        (m) => m.PersonalMoney.personalExpenses.viewDialog.updateExpense,
      )}
    />
  );
}
