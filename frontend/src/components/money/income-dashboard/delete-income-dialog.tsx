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
import type { RecentIncomeRecord } from "./income-dashboard-data";

type DeleteIncomeDialogProps = {
  income: RecentIncomeRecord;
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement | null;
};

export function DeleteIncomeDialog({
  familyId,
  income,
  onOpenChange,
  onSuccess,
  open,
  trigger,
}: DeleteIncomeDialogProps) {
  const [isPending, setIsPending] = useState(false);

  async function deleteIncome() {
    setIsPending(true);
    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(familyId)}/money/transactions/${encodeURIComponent(income.id)}`,
    );
    setIsPending(false);

    if (!response.ok) {
      toast.error(response.message ?? "Income could not be deleted.");
      return;
    }

    toast.success("Income deleted successfully");
    await onSuccess?.();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
              Delete income
            </Button>
          ) : (
            trigger
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete income?</AlertDialogTitle>
          <AlertDialogDescription>
            This reverses {income.source} and keeps its audit history. It will
            no longer be included in income totals.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={deleteIncome}
            variant="destructive"
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Delete income
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
