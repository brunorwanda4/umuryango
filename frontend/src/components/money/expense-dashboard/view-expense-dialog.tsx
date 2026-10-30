"use client";

import type * as React from "react";
import { ViewTransactionDialog } from "@/components/common/money/view-transaction-dialog";
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
  const ExpenseIcon = expense.icon;

  return (
    <ViewTransactionDialog
      amountLabel="Amount spent"
      amountMinorUnits={expense.amountMinorUnits}
      category={expense.category}
      categoryClassName={expense.categoryClassName}
      currency={expense.currency}
      date={expense.date}
      dateLabel="Date spent"
      deleteLabel="Delete expense"
      detailsDescription="Review the recorded expense and payment information."
      detailsTitle="Expense details"
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
      updateLabel="Update expense"
    />
  );
}
