"use client";

import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { IncomeCategory } from "@/components/money/income-dashboard/income-dashboard-data";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { IncomeMonthPicker } from "./income-month-picker";

/**
 * The action bar rendered inside the income page header.
 *
 * Contains the month picker and — when the user has the RECORD_INCOME
 * capability — the "Add income" dialog trigger. Split out so that the
 * button and picker can be unit-tested or reused in a sheet/modal layout.
 *
 * @example
 * <IncomePageActions
 *   canRecordIncome={canRecordIncome}
 *   categories={categories}
 *   family={family}
 *   period={period}
 *   onPeriodChange={setPeriod}
 *   onSuccess={reload}
 * />
 */
export function IncomePageActions({
  canRecordIncome,
  categories,
  family,
  period,
  onPeriodChange,
  onSuccess,
}: {
  /** Whether the current user has permission to record income. */
  canRecordIncome: boolean;
  /** Full category list (filtered to INCOME+ACTIVE inside MoneyFormDialog). */
  categories: IncomeCategory[];
  /** Resolved family detail; null while loading or on error. */
  family: FamilyDetail | null;
  /** Currently selected dashboard period as ISO date strings. */
  period: { from: string; to: string };
  /** Called with the new ISO date range when the user picks a period. */
  onPeriodChange: (period: { from: string; to: string }) => void;
  /** Called after a successful income record or category creation. */
  onSuccess: () => void | Promise<void>;
}) {
  return (
    <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
      <IncomeMonthPicker period={period} onPeriodChange={onPeriodChange} />

      {canRecordIncome && family ? (
        <MoneyFormDialog
          categories={categories}
          familyId={family.id}
          onCategoryCreated={onSuccess}
          onSuccess={onSuccess}
          triggerSize="default"
          type="income"
        />
      ) : null}
    </div>
  );
}
