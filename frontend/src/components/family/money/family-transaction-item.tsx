"use client";

import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { MoneyMobileTransactionRow } from "@/components/common/money-section/money-mobile-transaction-row";

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
  paymentIcon,
  counterparty,
  amountMinorUnits,
  currency,
  direction = "income",
  icon,
  iconClassName,
  categoryClassName,
  onView,
  actions,
  extraActions,
}: FamilyTransactionItemProps) {
  const subtitle = counterparty
    ? `${counterparty.label}: ${counterparty.name}`
    : (description ?? null);

  return (
    <li className="list-none">
      <MoneyMobileTransactionRow
        direction={direction}
        title={title}
        subtitle={subtitle}
        category={category}
        categoryClassName={categoryClassName}
        paymentMethod={paymentMethod}
        paymentIcon={paymentIcon}
        date={date}
        amountMinorUnits={amountMinorUnits}
        currency={currency}
        status={status}
        statusVariant={statusVariant}
        icon={icon}
        iconClassName={iconClassName}
        onView={onView}
        actions={actions}
        extraActions={extraActions}
      />
    </li>
  );
}
