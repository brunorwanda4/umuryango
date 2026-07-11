"use client";

import { MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { RecentIncomeRecord } from "./income-dashboard-data";

type RecentIncomeItemsProps = {
  data: RecentIncomeRecord[];
};

export function RecentIncomeItems({ data }: RecentIncomeItemsProps) {
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
      {data.map((income) => {
        const SourceIcon = income.icon;
        const PaymentIcon = income.paymentIcon;

        return (
          <Item key={income.id} asChild variant="outline">
            <li>
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
              <ItemActions className="ml-auto">
                <span className="font-bold text-chart-2 text-sm">
                  <CompactMoney
                    currency="RWF"
                    value={income.amountMinorUnits}
                  />
                </span>
                <Button
                  aria-label={`Open actions for ${income.source}`}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <MoreHorizontalIcon aria-hidden="true" />
                </Button>
              </ItemActions>
            </li>
          </Item>
        );
      })}
    </ul>
  );
}
