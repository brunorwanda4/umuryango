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
  categories: IncomeCategory[];
  family: FamilyDetail | null;
  period: { from: string; to: string };
  onPeriodChange: (period: { from: string; to: string }) => void;
  onSuccess: () => void | Promise<void>;
}) {
  return (
    <div className="mt-4 flex w-full gap-3 sm:w-auto flex-row lg:mt-0">
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
