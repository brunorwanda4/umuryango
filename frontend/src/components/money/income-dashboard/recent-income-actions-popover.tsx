"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createTranslator } from "@/i18n/translate";
import { DeleteIncomeDialog } from "./delete-income-dialog";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";
import { UpdateIncomeDialog } from "./update-income-dialog";
import { ViewIncomeDialog } from "./view-income-dialog";

type RecentIncomeActionsPopoverProps = {
  income: RecentIncomeRecord;
  categories: IncomeCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
};

export function RecentIncomeActionsPopover({
  categories,
  familyId,
  income,
  onSuccess,
}: RecentIncomeActionsPopoverProps) {
  const t = createTranslator("PersonalMoney.personalIncome");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t(
            (m) => m.PersonalMoney.personalIncome.actions.openActionsAria,
            { source: income.source },
          )}
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
          <ViewIncomeDialog
            categories={categories}
            familyId={familyId}
            income={income}
            onSuccess={onSuccess}
            searchParamValue={`view-income-action-${income.id}`}
          />
          <UpdateIncomeDialog
            categories={categories}
            familyId={familyId}
            income={income}
            onSuccess={onSuccess}
          />
          <DeleteIncomeDialog
            familyId={familyId}
            income={income}
            onSuccess={onSuccess}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
