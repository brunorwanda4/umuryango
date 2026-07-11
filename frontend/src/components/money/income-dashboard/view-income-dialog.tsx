"use client";

import { EyeIcon } from "lucide-react";
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
import type { RecentIncomeRecord } from "./income-dashboard-data";

type ViewIncomeDialogProps = {
  income: RecentIncomeRecord;
};

export function ViewIncomeDialog({ income }: ViewIncomeDialogProps) {
  return (
    <Dialog syncWithSearchParams={false}>
      <DialogTrigger asChild>
        <Button
          className="justify-start"
          size="sm"
          type="button"
          variant="ghost"
        >
          <EyeIcon aria-hidden="true" data-icon="inline-start" />
          View income
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Income details</DialogTitle>
          <DialogDescription>{income.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{income.source}</span>
              <span className="text-muted-foreground text-sm">
                {income.date}
              </span>
            </div>
            <span className="font-bold text-chart-2">
              <CompactMoney currency="RWF" value={income.amountMinorUnits} />
            </span>
          </div>
          <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Category</span>
              <Badge className={income.categoryClassName}>
                {income.category}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Payment method</span>
              <span>{income.paymentMethod}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
