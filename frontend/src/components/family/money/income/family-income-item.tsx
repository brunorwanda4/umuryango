"use client";

import type { FamilyDetail } from "@/components/family/dashboard/types";
import { FamilyTransactionItem } from "../family-transaction-item";
import {
  formatTransactionPaymentMethod,
  getStatusBadgeVariant,
  getTransactionCategoryStyle,
  getTransactionPaymentStyle,
} from "../money-ui-helpers";
import { formatDate } from "../utils";
import {
  type IncomeAction,
  IncomeActionsDropdown,
} from "./income-actions-dropdown";
import type { IncomeTransaction } from "./types-and-schemas";

export type FamilyIncomeItemProps = {
  tx: IncomeTransaction;
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (tx: IncomeTransaction, action: IncomeAction) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
};

export function FamilyIncomeItem({
  tx,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
}: FamilyIncomeItemProps) {
  const categoryName = tx.category.name;
  const categoryStyle = getTransactionCategoryStyle(categoryName);
  const paymentStyle = getTransactionPaymentStyle(tx.paymentMethod);
  const title = tx.description || categoryName || "Income Transaction";

  return (
    <FamilyTransactionItem
      title={title}
      category={categoryName}
      status={tx.status}
      statusVariant={getStatusBadgeVariant(tx.status)}
      description={tx.description}
      date={formatDate(tx.date)}
      paymentMethod={formatTransactionPaymentMethod(tx.paymentMethod)}
      paymentIcon={paymentStyle.icon}
      counterparty={
        tx.receivedFrom ? { label: "By", name: tx.receivedFrom } : null
      }
      amountMinorUnits={tx.amountMinorUnits}
      currency={currency}
      direction="income"
      icon={categoryStyle.icon}
      iconClassName={categoryStyle.className}
      categoryClassName={categoryStyle.className}
      onView={() => handleActionClick(tx, "view")}
      actions={
        <IncomeActionsDropdown
          tx={tx}
          family={family}
          isAdmin={isAdmin}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
        />
      }
    />
  );
}
