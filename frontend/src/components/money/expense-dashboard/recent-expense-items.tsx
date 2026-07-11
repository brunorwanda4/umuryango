"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
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
              Try another search term to find matching expense records.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-4 px-5 pb-5 sm:px-6">
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
  const SourceIcon = expense.icon;
  const PaymentIcon = expense.paymentIcon;

  return (
    <>
      <li>
        <Item
          className="relative cursor-pointer hover:bg-muted/50"
          onClick={() => setIsViewOpen(true)}
          variant="outline"
        >
          <button
            aria-label={`View expense details for ${expense.source}`}
            className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setIsViewOpen(true)}
            type="button"
          />
          <ItemMedia
            variant="icon"
            className={cn("size-9 rounded-full", expense.sourceClassName)}
          >
            <SourceIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="max-w-full">
              <span className="truncate">{expense.source}</span>
              <Badge className={expense.categoryClassName}>
                {expense.category}
              </Badge>
            </ItemTitle>
            <ItemDescription>{expense.description}</ItemDescription>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              <span>{expense.date}</span>
              <span aria-hidden="true">/</span>
              <span className="inline-flex items-center gap-1">
                <PaymentIcon aria-hidden="true" />
                {expense.paymentMethod}
              </span>
            </div>
          </ItemContent>
          <ItemActions className="relative z-10 ml-auto">
            <span className="font-bold text-chart-1 text-sm">
              <CompactMoney currency="RWF" value={expense.amountMinorUnits} />
            </span>
            <RecentExpenseActionsPopover
              categories={categories}
              familyId={familyId}
              expense={expense}
              onSuccess={onSuccess}
            />
          </ItemActions>
        </Item>
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
