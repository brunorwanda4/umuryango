"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { MoneyMobileTransactionRow } from "@/components/common/money-section/money-mobile-transaction-row";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import type {
  ExpenseCategory,
  RecentExpenseRecord,
} from "./expense-dashboard-data";
import { RecentExpenseActionsPopover } from "./recent-expense-actions-popover";
import { ViewExpenseDialog } from "./view-expense-dialog";

type RecentExpenseItemsProps = {
  data: RecentExpenseRecord[];
  categories: ExpenseCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
};

export function RecentExpenseItems({
  categories,
  data,
  familyId,
  onSuccess,
}: RecentExpenseItemsProps) {
  const t = createTranslator("PersonalMoney.personalExpenses");

  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border border-zinc-800 bg-zinc-900/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" className="text-zinc-500" />
            </EmptyMedia>
            <EmptyTitle className="text-zinc-300">
              {t((m) => m.PersonalMoney.personalExpenses.items.noExpensesTitle)}
            </EmptyTitle>
            <EmptyDescription className="text-zinc-500 text-xs">
              {t((m) => m.PersonalMoney.personalExpenses.items.noExpensesDesc)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2.5 px-4 pb-4 sm:px-6">
      {data.map((expense) => (
        <RecentExpenseItem
          categories={categories}
          familyId={familyId}
          expense={expense}
          key={expense.id}
          onSuccess={onSuccess}
        />
      ))}
    </ul>
  );
}

function RecentExpenseItem({
  categories,
  familyId,
  expense,
  onSuccess,
}: {
  categories: ExpenseCategory[];
  familyId: string;
  expense: RecentExpenseRecord;
  onSuccess: () => void | Promise<void>;
}) {
  const [isViewOpen, setIsViewOpen] = useState(false);

  return (
    <>
      <li className="list-none">
        <MoneyMobileTransactionRow
          direction="expense"
          title={expense.source}
          subtitle={
            expense.description !== "No additional notes"
              ? expense.description
              : null
          }
          category={expense.category}
          categoryClassName={expense.categoryClassName}
          paymentMethod={expense.paymentMethod}
          paymentIcon={expense.paymentIcon}
          date={expense.date}
          amountMinorUnits={expense.amountMinorUnits}
          currency={expense.currency}
          status={expense.status}
          icon={expense.icon}
          iconClassName={expense.sourceClassName}
          onView={() => setIsViewOpen(true)}
          actions={
            <RecentExpenseActionsPopover
              categories={categories}
              familyId={familyId}
              expense={expense}
              onSuccess={onSuccess}
            />
          }
        />
      </li>
      <ViewExpenseDialog
        categories={categories}
        familyId={familyId}
        expense={expense}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        trigger={null}
        onSuccess={onSuccess}
      />
    </>
  );
}
