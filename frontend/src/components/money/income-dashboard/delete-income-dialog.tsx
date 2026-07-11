"use client";

import { Trash2Icon } from "lucide-react";
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
import type { RecentIncomeRecord } from "./income-dashboard-data";

type DeleteIncomeDialogProps = {
  income: RecentIncomeRecord;
};

export function DeleteIncomeDialog({ income }: DeleteIncomeDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="justify-start text-destructive"
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" data-icon="inline-start" />
          Delete income
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete income?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {income.source} from the recent income list once
            live data is connected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Delete income
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
