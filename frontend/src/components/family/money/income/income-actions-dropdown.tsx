"use client";

import {
  CheckCircleIcon,
  EyeIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../../dashboard/types";
import type { IncomeTransaction } from "./types-and-schemas";

export type IncomeAction = "view" | "edit" | "delete" | "receipt";

export type IncomeActionsDropdownProps = {
  tx: IncomeTransaction;
  family: FamilyDetail;
  isAdmin: boolean;
  handleActionClick: (tx: IncomeTransaction, action: IncomeAction) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
};

export function IncomeActionsDropdown({
  tx,
  family,
  isAdmin,
  handleActionClick,
  handleSendApproval,
}: IncomeActionsDropdownProps) {
  const isApproved = tx.status === "APPROVED";
  const canEdit = !isApproved || isAdmin;

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
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "view");
          }}
        >
          <EyeIcon className="size-4 mr-2" />
          View Details
        </DropdownMenuItem>

        {canEdit ? (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              handleActionClick(tx, "edit");
            }}
          >
            <PencilIcon className="size-4 mr-2" />
            Edit Record
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <LockIcon className="size-4 mr-2" />
            Locked (Approved)
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "receipt");
          }}
        >
          <UploadIcon className="size-4 mr-2" />
          Attach Receipt
        </DropdownMenuItem>

        {tx.status === "PENDING" &&
          hasCapability(family, "APPROVE_EXPENSE") && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                handleSendApproval(tx);
              }}
              className="text-primary font-medium"
            >
              <CheckCircleIcon className="size-4 mr-2" />
              Approve Income
            </DropdownMenuItem>
          )}

        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            handleActionClick(tx, "delete");
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2Icon className="size-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
