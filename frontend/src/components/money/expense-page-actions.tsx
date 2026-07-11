"use client";

import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { ExpenseCategory } from "@/components/money/expense-dashboard/expense-dashboard-data";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { IncomeMonthPicker } from "./income-month-picker";

/**
 * The action bar rendered inside the expenses page header.
 *
 * Contains the month picker and — when the user has the RECORD_EXPENSE
 * capability — the "Add expense" dialog trigger. Split out so that the
 * button and picker can be unit-tested or reused in a sheet/modal layout.
 *
 * @example
 * <ExpensePageActions
 *   canRecordExpense={canRecordExpense}
 *   categories={categories}
 *   family={family}
 *   month={month}
 *   onMonthChange={setMonth}
 *   onSuccess={reload}
 * />
 */
export function ExpensePageActions({
  canRecordExpense,
  categories,
  family,
  month,
  onMonthChange,
  onSuccess,
}: {
  /** Whether the current user has permission to record expenses. */
  canRecordExpense: boolean;
  /** Full category list (filtered to EXPENSE+ACTIVE inside MoneyFormDialog). */
  categories: ExpenseCategory[];
  /** Resolved family detail; null while loading or on error. */
  family: FamilyDetail | null;
  /** Currently selected month as a `YYYY-MM` string. */
  month: string;
  /** Called with the new `YYYY-MM` string when the user picks a month. */
  onMonthChange: (month: string) => void;
  /** Called after a successful expense record or category creation. */
  onSuccess: () => void | Promise<void>;
}) {
  return (
    <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
      <IncomeMonthPicker month={month} onMonthChange={onMonthChange} />

      {canRecordExpense && family ? (
        <MoneyFormDialog
          categories={categories}
          familyId={family.id}
          onCategoryCreated={onSuccess}
          onSuccess={onSuccess}
          triggerSize="default"
          type="expense"
        />
      ) : null}
    </div>
  );
}
