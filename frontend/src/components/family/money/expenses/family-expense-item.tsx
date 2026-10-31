"use client";

import { ReceiptTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import { FamilyTransactionItem } from "../family-transaction-item";
import {
  formatTransactionPaymentMethod,
  getStatusBadgeVariant,
  getTransactionCategoryStyle,
  getTransactionPaymentStyle,
} from "../money-ui-helpers";
import { formatDate } from "../utils";
import {
  type ExpenseAction,
  ExpenseActionsDropdown,
} from "./expense-actions-dropdown";
import type { ExpenseTransaction } from "./types-and-schemas";

export type FamilyExpenseItemProps = {
  tx: ExpenseTransaction;
  currency: string;
  isAdmin: boolean;
  handleActionClick: (tx: ExpenseTransaction, action: ExpenseAction) => void;
  handleSendApproval: (tx: ExpenseTransaction) => void;
  handleDuplicate: (tx: ExpenseTransaction) => void;
  handleDownloadReceipt: (tx: ExpenseTransaction) => void;
};

export function FamilyExpenseItem({
  tx,
  currency,
  isAdmin,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
}: FamilyExpenseItemProps) {
  const t = createTranslator("FamilyExpenses");
  const categoryName = tx.category.name;
  const categoryStyle = getTransactionCategoryStyle(categoryName);
  const paymentStyle = getTransactionPaymentStyle(tx.paymentMethod);
  const firstReceipt = tx.receipts?.[0];
  const title = tx.description || categoryName || t("dialogs.addTitle");

  const counterparty = tx.receivedFrom
    ? { label: "To", name: tx.receivedFrom }
    : tx.receivedBy
      ? { label: "By", name: tx.receivedBy }
      : null;

  const extraActions = firstReceipt ? (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        handleDownloadReceipt(tx);
      }}
      className="hidden sm:flex max-w-[130px] h-7 text-xs px-2"
    >
      <ReceiptTextIcon className="size-3" aria-hidden="true" />
      <span className="truncate">{firstReceipt.fileName}</span>
    </Button>
  ) : (
    <Badge
      variant="outline"
      className="hidden sm:inline-flex text-xs font-normal h-6"
    >
      {t("table.noReceipt")}
    </Badge>
  );

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
      counterparty={counterparty}
      amountMinorUnits={tx.amountMinorUnits}
      currency={currency}
      direction="expense"
      icon={categoryStyle.icon}
      iconClassName={categoryStyle.className}
      categoryClassName={categoryStyle.className}
      onView={() => handleActionClick(tx, "view")}
      extraActions={extraActions}
      actions={
        <ExpenseActionsDropdown
          tx={tx}
          isAdmin={isAdmin}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
          handleDuplicate={handleDuplicate}
          handleDownloadReceipt={handleDownloadReceipt}
        />
      }
    />
  );
}
