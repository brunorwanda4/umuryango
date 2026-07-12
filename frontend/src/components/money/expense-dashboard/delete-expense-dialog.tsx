"use client";

import { Trash2Icon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import apiRequest from "@/service/api";
import type { RecentExpenseRecord } from "./expense-dashboard-data";

type DeleteExpenseDialogProps = {
  expense: RecentExpenseRecord;
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement | null;
};

export function DeleteExpenseDialog({
  familyId,
  expense,
  onOpenChange,
  onSuccess,
  open,
  trigger,
}: DeleteExpenseDialogProps) {
  const [isPending, setIsPending] = useState(false);

  async function deleteExpense() {
    setIsPending(true);
    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(familyId)}/money/transactions/${encodeURIComponent(expense.id)}`,
    );
    setIsPending(false);

    if (!response.ok) {
      toast.error(response.message ?? "Expense could not be deleted.");
      return;
    }

    toast.success("Expense deleted successfully");
    await onSuccess?.();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      searchParamValue={`delete-expense-${expense.id}`}
    >
      {trigger !== null && (
        <AlertDialogTrigger asChild>
          {trigger === undefined ? (
            <Button
              className="justify-start text-destructive"
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2Icon aria-hidden="true" data-icon="inline-start" />
              Delete expense
            </Button>
          ) : (
            trigger
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
          <AlertDialogDescription>
            This reverses {expense.source} and keeps its audit history. It will
            no longer be included in expense totals.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={deleteExpense}
            variant="destructive"
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Delete expense
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
