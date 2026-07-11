"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteIncomeDialog } from "./delete-income-dialog";
import type { RecentIncomeRecord } from "./income-dashboard-data";
import { UpdateIncomeDialog } from "./update-income-dialog";
import { ViewIncomeDialog } from "./view-income-dialog";

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
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 gap-2 p-2"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <ViewIncomeDialog income={income} />
          <UpdateIncomeDialog income={income} />
          <DeleteIncomeDialog income={income} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
