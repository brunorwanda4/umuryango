"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import type {
  ExpenseCategory,
  RecentExpenseRecord,
} from "./expense-dashboard-data";
import { UpdateExpenseDialog } from "./update-expense-dialog";
import { ViewExpenseDialog } from "./view-expense-dialog";

type RecentExpenseActionsPopoverProps = {
  expense: RecentExpenseRecord;
  categories: ExpenseCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
};

export function RecentExpenseActionsPopover({
  categories,
  familyId,
  expense,
  onSuccess,
}: RecentExpenseActionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Open actions for ${expense.source}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 gap-2 p-2"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <ViewExpenseDialog
            categories={categories}
            familyId={familyId}
            expense={expense}
            onSuccess={onSuccess}
            searchParamValue={`view-expense-action-${expense.id}`}
          />
          <UpdateExpenseDialog
            categories={categories}
            familyId={familyId}
            expense={expense}
            onSuccess={onSuccess}
          />
          <DeleteExpenseDialog
            familyId={familyId}
            expense={expense}
            onSuccess={onSuccess}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
