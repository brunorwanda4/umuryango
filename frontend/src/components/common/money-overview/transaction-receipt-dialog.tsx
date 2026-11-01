"use client";

import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTranslator } from "@/i18n/translate";
import { formatFullMinorUnits } from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";
import type { SharedTransactionItem } from "./types";

export interface TransactionReceiptDialogProps {
  transaction: SharedTransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionReceiptDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionReceiptDialogProps) {
  const t = createTranslator("MoneyOverview");

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-5 sm:p-6 space-y-4">
        <DialogHeader className="pb-2 border-b border-border/80">
          <DialogTitle className="text-xs sm:text-sm font-bold text-foreground">
            {t((m) => m.MoneyOverview.transactionReceipt)}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for transaction {transaction.title}
          </DialogDescription>
        </DialogHeader>

        {/* Hero Amount in Receipt */}
        <div className="text-center py-2">
          <div
            className={cn(
              "text-2xl sm:text-3xl font-black font-mono tracking-tight",
              isIncome
                ? "text-emerald-500 dark:text-emerald-400"
                : isExpense
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-foreground",
            )}
          >
            {isIncome ? "+" : isExpense ? "-" : ""}
            {formatFullMinorUnits(
              transaction.amountMinorUnits,
              transaction.currency,
            )}
          </div>
          <p className="text-xs font-semibold text-foreground mt-1">
            {transaction.title}
          </p>
          {transaction.category ? (
            <Badge
              variant="secondary"
              className="mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
            >
              {transaction.category}
            </Badge>
          ) : null}
        </div>

        {/* Details card */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 text-xs">
          {transaction.paymentMethod ? (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t((m) => m.MoneyOverview.paymentRail)}:
              </span>
              <span className="text-foreground font-medium">
                {transaction.paymentMethod}
              </span>
            </div>
          ) : null}

          {transaction.reference ? (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t((m) => m.MoneyOverview.reference)}:
              </span>
              <span className="text-foreground font-mono text-[11px]">
                {transaction.reference}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {t((m) => m.MoneyOverview.dateTime)}:
            </span>
            <span className="text-foreground">{transaction.date}</span>
          </div>

          {transaction.createdBy ? (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t((m) => m.MoneyOverview.submittedBy)}:
              </span>
              <span className="text-foreground font-medium">
                {transaction.createdBy}
              </span>
            </div>
          ) : null}

          {transaction.notes ? (
            <div className="flex justify-between items-start gap-2">
              <span className="text-muted-foreground">
                {t((m) => m.MoneyOverview.notes)}:
              </span>
              <span className="text-foreground text-right">
                {transaction.notes}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between items-center pt-2 border-t border-border/80">
            <span className="text-muted-foreground">
              {t((m) => m.MoneyOverview.status)}:
            </span>
            <span
              className={cn(
                "font-bold flex items-center gap-1 text-[11px]",
                transaction.statusVariant === "success" ||
                  transaction.status === "Approved" ||
                  transaction.status === "Received" ||
                  transaction.status === "Paid"
                  ? "text-emerald-500 dark:text-emerald-400"
                  : transaction.statusVariant === "danger"
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-amber-500 dark:text-amber-400",
              )}
            >
              {transaction.statusVariant === "success" ||
              transaction.status === "Approved" ||
              transaction.status === "Received" ||
              transaction.status === "Paid" ? (
                <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
              ) : transaction.statusVariant === "danger" ? (
                <XCircleIcon className="size-3.5" aria-hidden="true" />
              ) : (
                <ClockIcon className="size-3.5" aria-hidden="true" />
              )}
              <span>{transaction.status}</span>
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            className="w-full font-bold text-xs"
            onClick={() => onOpenChange(false)}
          >
            {t((m) => m.MoneyOverview.done)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
