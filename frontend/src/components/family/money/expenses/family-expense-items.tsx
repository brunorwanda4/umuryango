"use client";

import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CarIcon,
  CheckCircleIcon,
  CircleDollarSignIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  HeartPulseIcon,
  HomeIcon,
  LandmarkIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  ReceiptTextIcon,
  SearchIcon,
  SendIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  Trash2Icon,
  UploadIcon,
  UtensilsIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate } from "../utils";
import { formatPaymentMethod } from "./expense-utils";
import type { ExpenseTransaction } from "./types-and-schemas";

type FamilyExpenseItemsProps = {
  data: ExpenseTransaction[];
  currency: string;
  isAdmin: boolean;
  handleActionClick: (
    tx: ExpenseTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: ExpenseTransaction) => void;
  handleDuplicate: (tx: ExpenseTransaction) => void;
  handleDownloadReceipt: (tx: ExpenseTransaction) => void;
};

export function FamilyExpenseItems({
  data,
  currency,
  isAdmin,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
}: FamilyExpenseItemsProps) {
  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No expenses found</EmptyTitle>
            <EmptyDescription>
              Try another search term or filter to find matching family expense
              records.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-4 px-5 pb-5 sm:px-6">
      {data.map((tx) => (
        <FamilyExpenseItem
          key={tx.id}
          tx={tx}
          currency={currency}
          isAdmin={isAdmin}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
          handleDuplicate={handleDuplicate}
          handleDownloadReceipt={handleDownloadReceipt}
        />
      ))}
    </ul>
  );
}

function FamilyExpenseItem({
  tx,
  currency,
  isAdmin,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
}: {
  tx: ExpenseTransaction;
  currency: string;
  isAdmin: boolean;
  handleActionClick: (
    tx: ExpenseTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: ExpenseTransaction) => void;
  handleDuplicate: (tx: ExpenseTransaction) => void;
  handleDownloadReceipt: (tx: ExpenseTransaction) => void;
}) {
  const categoryName = tx.category.name;
  const categoryStyle = getCategoryStyle(categoryName);
  const paymentStyle = getPaymentStyle(tx.paymentMethod);

  const SourceIcon = categoryStyle.icon;
  const PaymentIcon = paymentStyle.icon;

  const isApproved = tx.status === "APPROVED";
  const canEdit = !isApproved || isAdmin;
  const firstReceipt = tx.receipts?.[0];

  const title = tx.description || categoryName || "Expense Transaction";

  return (
    <li>
      <Item
        className="relative cursor-pointer hover:bg-muted/50"
        onClick={() => handleActionClick(tx, "view")}
        variant="outline"
      >
        <button
          aria-label={`View details for ${title}`}
          className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => handleActionClick(tx, "view")}
          type="button"
        />
        <ItemMedia
          variant="icon"
          className={cn("size-9 rounded-full", categoryStyle.className)}
        >
          <SourceIcon aria-hidden="true" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate font-semibold">{title}</span>
            <Badge
              className={cn(
                "text-xs font-normal border-0 shrink-0",
                categoryStyle.className,
              )}
            >
              {categoryName}
            </Badge>
            <Badge
              variant={
                tx.status === "APPROVED"
                  ? "default"
                  : tx.status === "PENDING"
                    ? "secondary"
                    : tx.status === "REJECTED"
                      ? "destructive"
                      : "outline"
              }
              className="text-xs shrink-0"
            >
              {tx.status}
            </Badge>
          </ItemTitle>
          {tx.description && (
            <ItemDescription className="truncate">
              {tx.description}
            </ItemDescription>
          )}
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs mt-1">
            <span>{formatDate(tx.date)}</span>
            <span aria-hidden="true">/</span>
            <span className="inline-flex items-center gap-1">
              <PaymentIcon aria-hidden="true" className="size-3.5" />
              {formatPaymentMethod(tx.paymentMethod)}
            </span>
            {tx.receivedFrom && (
              <>
                <span aria-hidden="true">/</span>
                <span className="truncate">To: {tx.receivedFrom}</span>
              </>
            )}
            {tx.receivedBy && (
              <>
                <span aria-hidden="true">/</span>
                <span className="truncate">By: {tx.receivedBy}</span>
              </>
            )}
          </div>
        </ItemContent>
        <ItemActions className="relative z-10 ml-auto flex items-center gap-2">
          {firstReceipt ? (
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
              No receipt
            </Badge>
          )}
          <span className="font-bold text-chart-1 text-sm whitespace-nowrap px-1">
            <CompactMoney currency={currency} value={tx.amountMinorUnits} />
          </span>
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
                View Details
              </DropdownMenuItem>

              {canEdit ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    handleActionClick(tx, "edit");
                  }}
                >
                  <PencilIcon className="mr-2 size-4" />
                  Edit Record
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <LockIcon className="mr-2 size-4" />
                  Locked (Approved)
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleActionClick(tx, "delete");
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleActionClick(tx, "receipt");
                }}
              >
                <UploadIcon className="mr-2 size-4" />
                Upload Receipt
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={!firstReceipt}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownloadReceipt(tx);
                }}
              >
                <DownloadIcon className="mr-2 size-4" />
                Download Receipt
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
                Send for Approval
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleDuplicate(tx);
                }}
              >
                <CopyIcon className="mr-2 size-4" />
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      </Item>
    </li>
  );
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (
    normalized.includes("food") ||
    normalized.includes("grocery") ||
    normalized.includes("groceries")
  ) {
    return { icon: ShoppingCartIcon, className: "bg-chart-1/10 text-chart-1" };
  }
  if (
    normalized.includes("transport") ||
    normalized.includes("travel") ||
    normalized.includes("fuel")
  ) {
    return { icon: CarIcon, className: "bg-chart-3/10 text-chart-3" };
  }
  if (
    normalized.includes("health") ||
    normalized.includes("medical") ||
    normalized.includes("clinic")
  ) {
    return { icon: HeartPulseIcon, className: "bg-chart-4/10 text-chart-4" };
  }
  if (
    normalized.includes("restaurant") ||
    normalized.includes("dining") ||
    normalized.includes("lunch") ||
    normalized.includes("dinner")
  ) {
    return { icon: UtensilsIcon, className: "bg-chart-5/10 text-chart-5" };
  }
  if (
    normalized.includes("rent") ||
    normalized.includes("house") ||
    normalized.includes("home") ||
    normalized.includes("utilities")
  ) {
    return { icon: HomeIcon, className: "bg-chart-2/10 text-chart-2" };
  }
  if (normalized.includes("business") || normalized.includes("office")) {
    return {
      icon: BriefcaseBusinessIcon,
      className: "bg-chart-1/10 text-chart-1",
    };
  }
  return {
    icon: CircleDollarSignIcon,
    className: "bg-muted text-muted-foreground",
  };
}

function getPaymentStyle(method: string | null) {
  const account = method ?? "OTHER";
  if (account.includes("BANK")) {
    return { icon: LandmarkIcon, className: "bg-chart-1 text-background" };
  }
  if (account.includes("MOBILE")) {
    return { icon: SmartphoneIcon, className: "bg-chart-5 text-background" };
  }
  if (account.includes("CASH")) {
    return { icon: BanknoteIcon, className: "bg-chart-3 text-background" };
  }
  return { icon: WalletCardsIcon, className: "bg-muted text-foreground" };
}
