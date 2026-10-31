"use client";

import {
  CheckCircleIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTranslator } from "@/i18n/translate";
import type { ExpenseTransaction } from "./types-and-schemas";

export type ExpenseAction = "view" | "edit" | "delete" | "receipt";

export type ExpenseActionsDropdownProps = {
  tx: ExpenseTransaction;
  isAdmin: boolean;
  handleActionClick: (tx: ExpenseTransaction, action: ExpenseAction) => void;
  handleSendApproval: (tx: ExpenseTransaction) => void;
  handleDuplicate: (tx: ExpenseTransaction) => void;
  handleDownloadReceipt: (tx: ExpenseTransaction) => void;
};

export function ExpenseActionsDropdown({
  tx,
  isAdmin,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
}: ExpenseActionsDropdownProps) {
  const t = createTranslator("FamilyExpenses");
  const isApproved = tx.status === "APPROVED";
  const canEdit = !isApproved || isAdmin;
  const firstReceipt = tx.receipts?.[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="md:min-w-60 min-w-40">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "view");
          }}
        >
          <EyeIcon className="mr-2 size-4" />
          {t("actions.view")}
        </DropdownMenuItem>
        {canEdit ? (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              handleActionClick(tx, "edit");
            }}
          >
            <PencilIcon className="mr-2 size-4" />
            {t("actions.edit")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <LockIcon className="mr-2 size-4" />
            {t("actions.locked")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "delete");
          }}
        >
          <Trash2Icon className="mr-2 size-4" />
          {t("actions.delete")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "receipt");
          }}
        >
          <UploadIcon className="mr-2 size-4" />
          {t("actions.uploadReceipt")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!firstReceipt}
          onClick={(event) => {
            event.stopPropagation();
            handleDownloadReceipt(tx);
          }}
        >
          <DownloadIcon className="mr-2 size-4" />
          {t("actions.downloadReceipt")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleSendApproval(tx);
          }}
        >
          {tx.status === "PENDING" ? (
            <CheckCircleIcon className="mr-2 size-4" />
          ) : (
            <SendIcon className="mr-2 size-4" />
          )}
          {t("actions.sendForApproval")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleDuplicate(tx);
          }}
        >
          <CopyIcon className="mr-2 size-4" />
          {t("actions.duplicate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
