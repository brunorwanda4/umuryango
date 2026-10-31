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
  const t = createTranslator("PersonalMoney.personalIncome");
  const [isPending, setIsPending] = useState(false);

  async function deleteIncome() {
    setIsPending(true);
    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(familyId)}/money/transactions/${encodeURIComponent(income.id)}`,
    );
    setIsPending(false);

    if (!response.ok) {
      toast.error(
        response.message ??
          t((m) => m.PersonalMoney.personalIncome.deleteDialog.deleteError),
      );
      return;
    }

    toast.success(
      t((m) => m.PersonalMoney.personalIncome.deleteDialog.deletedToast),
    );
    await onSuccess?.();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      searchParamValue={`delete-income-${income.id}`}
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
              {t((m) => m.PersonalMoney.personalIncome.deleteDialog.confirm)}
            </Button>
          ) : (
            trigger
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t((m) => m.PersonalMoney.personalIncome.deleteDialog.title)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t((m) => m.PersonalMoney.personalIncome.deleteDialog.description, {
              source: income.source,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t((m) => m.PersonalMoney.personalIncome.deleteDialog.cancel)}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={deleteIncome}
            variant="destructive"
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {t((m) => m.PersonalMoney.personalIncome.deleteDialog.confirm)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
