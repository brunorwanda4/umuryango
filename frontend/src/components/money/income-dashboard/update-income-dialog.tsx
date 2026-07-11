"use client";

import { PencilIcon } from "lucide-react";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";
import type { RecentIncomeRecord } from "./income-dashboard-data";

type UpdateIncomeDialogProps = {
  income: RecentIncomeRecord;
};

function getIncomeAccount(paymentMethod: string) {
  if (paymentMethod.toLowerCase().includes("bank")) {
    return "bank-account";
  }

  if (paymentMethod.toLowerCase().includes("cash")) {
    return "cash";
  }

  return "mobile-money";
}

function getDateInputValue(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
}

export function UpdateIncomeDialog({ income }: UpdateIncomeDialogProps) {
  return (
    <MoneyFormDialog
      type="income"
      mode="update"
      defaultValues={{
        title: income.source,
        amountMinorUnits: income.amountMinorUnits,
        category: income.category,
        date: getDateInputValue(income.date),
        account: getIncomeAccount(income.paymentMethod),
      }}
      trigger={
        <Button
          className="justify-start"
          size="sm"
          type="button"
          variant="ghost"
        >
          <PencilIcon aria-hidden="true" data-icon="inline-start" />
          Update income
        </Button>
      }
    />
  );
}
