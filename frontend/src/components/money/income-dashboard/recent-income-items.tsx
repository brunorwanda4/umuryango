"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";
import { RecentIncomeActionsPopover } from "./recent-income-actions-popover";
import { ViewIncomeDialog } from "./view-income-dialog";

type RecentIncomeItemsProps = {
  data: RecentIncomeRecord[];
  categories: IncomeCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
};

export function RecentIncomeItems({
  categories,
  data,
  familyId,
  onSuccess,
}: RecentIncomeItemsProps) {
  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No income found</EmptyTitle>
            <EmptyDescription>
              Try another search term to find matching income records.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-4 px-5 pb-5 sm:px-6">
      {data.map((income) => (
        <RecentIncomeItem
          categories={categories}
          familyId={familyId}
          income={income}
          key={income.id}
          onSuccess={onSuccess}
        />
      ))}
    </ul>
  );
}

function RecentIncomeItem({
  categories,
  familyId,
  income,
  onSuccess,
}: {
  categories: IncomeCategory[];
  familyId: string;
  income: RecentIncomeRecord;
  onSuccess: () => void | Promise<void>;
}) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const SourceIcon = income.icon;
  const PaymentIcon = income.paymentIcon;

  return (
    <>
      <li>
        <Item
          className="relative cursor-pointer hover:bg-muted/50"
          onClick={() => setIsViewOpen(true)}
          variant="outline"
        >
          <button
            aria-label={`View income details for ${income.source}`}
            className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setIsViewOpen(true)}
            type="button"
          />
          <ItemMedia
            variant="icon"
            className={cn("size-9 rounded-full", income.sourceClassName)}
          >
            <SourceIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="max-w-full">
              <span className="truncate">{income.source}</span>
              <Badge className={income.categoryClassName}>
                {income.category}
              </Badge>
            </ItemTitle>
            <ItemDescription>{income.description}</ItemDescription>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              <span>{income.date}</span>
              <span aria-hidden="true">/</span>
              <span className="inline-flex items-center gap-1">
                <PaymentIcon aria-hidden="true" />
                {income.paymentMethod}
              </span>
            </div>
          </ItemContent>
          <ItemActions className="relative z-10 ml-auto">
            <span className="font-bold text-chart-2 text-sm">
              <CompactMoney currency="RWF" value={income.amountMinorUnits} />
            </span>
            <RecentIncomeActionsPopover
              categories={categories}
              familyId={familyId}
              income={income}
              onSuccess={onSuccess}
            />
          </ItemActions>
        </Item>
      </li>
      <ViewIncomeDialog
        categories={categories}
        familyId={familyId}
        income={income}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        trigger={null}
        onSuccess={onSuccess}
      />
    </>
  );
}
