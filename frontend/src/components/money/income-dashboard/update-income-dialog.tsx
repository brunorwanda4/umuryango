"use client";

import { PencilIcon } from "lucide-react";
import type * as React from "react";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";

type UpdateIncomeDialogProps = {
  income: RecentIncomeRecord;
  categories: IncomeCategory[];
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement | null;
};

export function UpdateIncomeDialog({
  categories,
  familyId,
  income,
  onOpenChange,
  onSuccess,
  open,
  trigger,
}: UpdateIncomeDialogProps) {
  const t = createTranslator("PersonalMoney.personalIncome");

  return (
    <MoneyFormDialog
      type="income"
      mode="update"
      categories={categories}
      familyId={familyId}
      incomeId={income.id}
      open={open}
      onOpenChange={onOpenChange}
      onCategoryCreated={onSuccess}
      onSuccess={onSuccess}
      defaultValues={{
        title: income.source,
        amountMinorUnits: Number(income.amountMinorUnits),
        categoryId: income.categoryId,
        date: income.dateValue,
        account: income.account,
        notes: income.notes,
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
            {t((m) => m.PersonalMoney.personalIncome.actions.edit)}
          </Button>
        ) : (
          trigger
        )
      }
    />
  );
}
