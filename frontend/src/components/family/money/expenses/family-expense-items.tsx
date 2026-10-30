"use client";

import { SearchIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExpenseAction } from "./expense-actions-dropdown";
import { FamilyExpenseItem } from "./family-expense-item";
import type { ExpenseTransaction } from "./types-and-schemas";

export type FamilyExpenseItemsProps = {
  data: ExpenseTransaction[];
  currency: string;
  isAdmin: boolean;
  handleActionClick: (tx: ExpenseTransaction, action: ExpenseAction) => void;
  handleSendApproval: (tx: ExpenseTransaction) => void;
  handleDuplicate: (tx: ExpenseTransaction) => void;
  handleDownloadReceipt: (tx: ExpenseTransaction) => void;
};

export function FamilyExpenseItems({
  data,
  currency,
  isAdmin,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
}: FamilyExpenseItemsProps) {
  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No expenses found</EmptyTitle>
            <EmptyDescription>
              Try another search term or filter to find matching family expense
              records.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-4 px-5 pb-5 sm:px-6">
      {data.map((tx) => (
        <FamilyExpenseItem
          key={tx.id}
          tx={tx}
          currency={currency}
          isAdmin={isAdmin}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
          handleDuplicate={handleDuplicate}
          handleDownloadReceipt={handleDownloadReceipt}
        />
      ))}
    </ul>
  );
}
