"use client";

import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

export type FamilyTransactionItemProps = {
  title: string;
  category: string;
  status: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  description?: string | null;
  date: string;
  paymentMethod?: string | null;
  paymentIcon?: LucideIcon;
  counterparty?: { label: string; name: string } | null;
  amountMinorUnits: string;
  currency: string;
  direction?: "income" | "expense";
  icon?: LucideIcon;
  iconClassName?: string;
  categoryClassName?: string;
  onView?: () => void;
  actions?: React.ReactNode;
  extraActions?: React.ReactNode;
};

export function FamilyTransactionItem({
  title,
  category,
  status,
  statusVariant = "secondary",
  description,
  date,
  paymentMethod,
  paymentIcon: PaymentIcon,
  counterparty,
  amountMinorUnits,
  currency,
  direction = "income",
  icon: SourceIcon,
  iconClassName,
  categoryClassName,
  onView,
  actions,
  extraActions,
}: FamilyTransactionItemProps) {
  return (
    <li>
      <Item
        className="relative cursor-pointer hover:bg-muted/50"
        onClick={onView}
        variant="outline"
      >
        <button
          aria-label={`View details for ${title}`}
          className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onView}
          type="button"
        />
        {SourceIcon && (
          <ItemMedia
            variant="icon"
            className={cn("size-9 rounded-full", iconClassName)}
          >
            <SourceIcon aria-hidden="true" />
          </ItemMedia>
        )}
        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate font-semibold">{title}</span>
            <Badge
              className={cn(
                "text-xs font-normal border-0 shrink-0",
                categoryClassName,
              )}
            >
              {category}
            </Badge>
            <Badge variant={statusVariant} className="text-xs shrink-0">
              {status}
            </Badge>
          </ItemTitle>
          {description && (
            <ItemDescription className="truncate">
              {description}
            </ItemDescription>
          )}
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs mt-1">
            <span>{date}</span>
            {paymentMethod && (
              <>
                <span aria-hidden="true">/</span>
                <span className="inline-flex items-center gap-1">
                  {PaymentIcon && (
                    <PaymentIcon aria-hidden="true" className="size-3.5" />
                  )}
                  {paymentMethod}
                </span>
              </>
            )}
            {counterparty && (
              <>
                <span aria-hidden="true">/</span>
                <span className="truncate">
                  {counterparty.label}: {counterparty.name}
                </span>
              </>
            )}
          </div>
        </ItemContent>
        <ItemActions className="relative z-10 ml-auto flex items-center gap-2">
          {extraActions}
          <span
            className={cn(
              "font-bold text-sm whitespace-nowrap px-1",
              direction === "income" ? "text-chart-2" : "text-chart-1",
            )}
          >
            <CompactMoney currency={currency} value={amountMinorUnits} />
          </span>
          {actions}
        </ItemActions>
      </Item>
    </li>
  );
}
