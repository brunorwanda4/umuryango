"use client";

import {
  CalendarDaysIcon,
  EyeIcon,
  PencilIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
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

export type ViewTransactionDialogProps = {
  title: string;
  description: string;
  amountMinorUnits: string;
  currency: string;
  date: string;
  dateLabel: string;
  category: string;
  categoryClassName: string;
  paymentMethod: string;
  paymentIcon: React.ElementType;
  amountLabel: string;
  detailsTitle: string;
  detailsDescription: string;
  updateLabel: string;
  deleteLabel: string;
  searchParamValue: string;
  leading: React.ReactNode;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderUpdate: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
  renderDelete: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
};

export function ViewTransactionDialog({
  amountLabel,
  amountMinorUnits,
  category,
  categoryClassName,
  date,
  dateLabel,
  deleteLabel,
  detailsDescription,
  detailsTitle,
  description,
  leading,
  onOpenChange,
  open,
  paymentIcon: PaymentIcon,
  paymentMethod,
  renderDelete,
  renderUpdate,
  searchParamValue,
  title,
  trigger,
  updateLabel,
  currency,
}: ViewTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        searchParamValue={searchParamValue}
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
                View
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="px-6 pt-6 pb-5 pr-14">
            <DialogTitle>{detailsTitle}</DialogTitle>
            <DialogDescription>{detailsDescription}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-6 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                {leading}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium leading-5">{title}</span>
                  <span className="text-muted-foreground text-sm leading-5">
                    {description}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                <span className="text-muted-foreground text-xs font-medium">
                  {amountLabel}
                </span>
                <span className="font-heading text-2xl font-semibold tabular-nums">
                  <CompactMoney currency={currency} value={amountMinorUnits} />
                </span>
              </div>
            </div>
            <dl className="overflow-hidden rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <CalendarDaysIcon className="text-muted-foreground size-4 shrink-0" />
                <dt className="text-muted-foreground text-sm">{dateLabel}</dt>
                <dd className="ml-auto text-right text-sm font-medium">
                  {date}
                </dd>
              </div>
              <div className="flex items-center gap-3 border-b px-4 py-3.5">
                <TagIcon className="text-muted-foreground size-4 shrink-0" />
                <dt className="text-muted-foreground text-sm">Category</dt>
                <dd className="ml-auto">
                  <Badge className={categoryClassName}>{category}</Badge>
                </dd>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <PaymentIcon className="text-muted-foreground size-4 shrink-0" />
                <dt className="text-muted-foreground text-sm">
                  Payment method
                </dt>
                <dd className="ml-auto text-right text-sm font-medium">
                  {paymentMethod}
                </dd>
              </div>
            </dl>
          </div>
          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setIsDeleteOpen(true);
              }}
              type="button"
              variant="destructive"
            >
              <Trash2Icon aria-hidden="true" data-icon="inline-start" />
              {deleteLabel}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setIsUpdateOpen(true);
              }}
              type="button"
            >
              <PencilIcon aria-hidden="true" data-icon="inline-start" />
              {updateLabel}
            </Button>
            <DialogClose asChild>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {renderUpdate({ open: isUpdateOpen, onOpenChange: setIsUpdateOpen })}
      {renderDelete({ open: isDeleteOpen, onOpenChange: setIsDeleteOpen })}
    </>
  );
}
