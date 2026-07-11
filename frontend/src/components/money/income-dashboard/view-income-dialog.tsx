"use client";

import { CalendarDaysIcon, EyeIcon, PencilIcon, TagIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { RecentIncomeRecord } from "./income-dashboard-data";
import { UpdateIncomeDialog } from "./update-income-dialog";

type ViewIncomeDialogProps = {
  income: RecentIncomeRecord;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: React.ReactElement | null;
};

export function ViewIncomeDialog({
  income,
  onOpenChange,
  open,
  trigger,
}: ViewIncomeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const IncomeIcon = income.icon;
  const PaymentIcon = income.paymentIcon;
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        syncWithSearchParams={false}
      >
        {trigger !== null && (
          <DialogTrigger asChild>
            {trigger ?? (
              <Button
                className="justify-start"
                size="sm"
                type="button"
                variant="ghost"
              >
                <EyeIcon aria-hidden="true" data-icon="inline-start" />
                View income
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="px-6 pt-6 pb-5 pr-14">
            <DialogTitle>Income details</DialogTitle>
            <DialogDescription>
              Review the recorded income and payment information.
            </DialogDescription>
          </DialogHeader>
          <Separator />

          <div className="flex flex-col gap-6 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <IncomeIcon aria-hidden="true" className="size-5" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium leading-5">{income.source}</span>
                  <span className="text-sm leading-5 text-muted-foreground">
                    {income.description}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                <span className="text-xs font-medium text-muted-foreground">
                  Amount received
                </span>
                <span className="font-heading text-2xl font-semibold tabular-nums">
                  <CompactMoney
                    currency="RWF"
                    value={income.amountMinorUnits}
                  />
                </span>
              </div>
            </div>

            <dl className="overflow-hidden rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <CalendarDaysIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <dt className="text-sm text-muted-foreground">Date received</dt>
                <dd className="ml-auto text-right text-sm font-medium">
                  {income.date}
                </dd>
              </div>

              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <TagIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <dt className="text-sm text-muted-foreground">Category</dt>
                <dd className="ml-auto">
                  <Badge className={income.categoryClassName}>
                    {income.category}
                  </Badge>
                </dd>
              </div>

              <div className="flex items-center gap-3 px-4 py-3.5">
                <PaymentIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <dt className="text-sm text-muted-foreground">
                  Payment method
                </dt>
                <dd className="ml-auto text-right text-sm font-medium">
                  {income.paymentMethod}
                </dd>
              </div>
            </dl>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <DialogClose asChild>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setIsOpen(false);
                setIsUpdateOpen(true);
              }}
              type="button"
            >
              <PencilIcon aria-hidden="true" data-icon="inline-start" />
              Update income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpdateIncomeDialog
        income={income}
        open={isUpdateOpen}
        onOpenChange={setIsUpdateOpen}
        trigger={null}
      />
    </>
  );
}
