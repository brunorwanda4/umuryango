"use client";

import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RecentIncomeRecord } from "./income-dashboard-data";

type RecentIncomeActionsPopoverProps = {
  income: RecentIncomeRecord;
};

export function RecentIncomeActionsPopover({
  income,
}: RecentIncomeActionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Open actions for ${income.source}`}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 gap-2 p-2">
        <div className="flex flex-col gap-1">
          <Button
            className="justify-start"
            size="sm"
            type="button"
            variant="ghost"
          >
            <EyeIcon aria-hidden="true" data-icon="inline-start" />
            View income
          </Button>
          <Button
            className="justify-start"
            size="sm"
            type="button"
            variant="ghost"
          >
            <PencilIcon aria-hidden="true" data-icon="inline-start" />
            Update income
          </Button>
          <Button
            className="justify-start text-destructive"
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2Icon aria-hidden="true" data-icon="inline-start" />
            Delete income
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
