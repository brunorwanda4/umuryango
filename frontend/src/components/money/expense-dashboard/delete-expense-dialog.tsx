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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("PersonalMoney.personalExpenses");
  const [isPending, setIsPending] = useState(false);

  async function deleteExpense() {
    setIsPending(true);
    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(familyId)}/money/transactions/${encodeURIComponent(expense.id)}`,
    );
    setIsPending(false);

    if (!response.ok) {
      toast.error(
        response.message ??
          t((m) => m.PersonalMoney.personalExpenses.deleteDialog.deleteError),
      );
      return;
    }

    toast.success(
      t((m) => m.PersonalMoney.personalExpenses.deleteDialog.deletedToast),
    );
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
              {t((m) => m.PersonalMoney.personalExpenses.deleteDialog.confirm)}
            </Button>
          ) : (
            trigger
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t((m) => m.PersonalMoney.personalExpenses.deleteDialog.title)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              (m) => m.PersonalMoney.personalExpenses.deleteDialog.description,
              { source: expense.source },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t((m) => m.PersonalMoney.personalExpenses.deleteDialog.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={deleteExpense}
            variant="destructive"
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {t((m) => m.PersonalMoney.personalExpenses.deleteDialog.confirm)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
