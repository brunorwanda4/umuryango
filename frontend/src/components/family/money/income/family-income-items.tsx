"use client";

import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CheckCircleIcon,
  CircleDollarSignIcon,
  EyeIcon,
  GiftIcon,
  LandmarkIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  SearchIcon,
  SmartphoneIcon,
  Trash2Icon,
  UploadIcon,
  UserIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

type FamilyIncomeItemsProps = {
  data: IncomeTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (
    tx: IncomeTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
};

export function FamilyIncomeItems({
  data,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
}: FamilyIncomeItemsProps) {
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
              Try another search term or filter to find matching family income
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
        <FamilyIncomeItem
          key={tx.id}
          tx={tx}
          currency={currency}
          isAdmin={isAdmin}
          family={family}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
        />
      ))}
    </ul>
  );
}

function FamilyIncomeItem({
  tx,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
}: {
  tx: IncomeTransaction;
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (
    tx: IncomeTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
}) {
  const categoryName = tx.category.name;
  const categoryStyle = getCategoryStyle(categoryName);
  const paymentStyle = getPaymentStyle(tx.paymentMethod);

  const SourceIcon = categoryStyle.icon;
  const PaymentIcon = paymentStyle.icon;

  const txIsApproved = tx.status === "APPROVED";
  const canEditThisTx = !txIsApproved || isAdmin;

  const title = tx.description || categoryName || "Income Transaction";

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
                <span>By: {tx.receivedFrom}</span>
              </>
            )}
          </div>
        </ItemContent>
        <ItemActions className="relative z-10 ml-auto flex items-center gap-2">
          <span className="font-bold text-chart-2 text-sm whitespace-nowrap">
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

              {canEditThisTx ? (
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
        </ItemActions>
      </Item>
    </li>
  );
}

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("salary")) {
    return { icon: UserIcon, className: "bg-chart-2/10 text-chart-2" };
  }
  if (normalized.includes("business")) {
    return {
      icon: BriefcaseBusinessIcon,
      className: "bg-chart-1/10 text-chart-1",
    };
  }
  if (normalized.includes("contribution") || normalized.includes("support")) {
    return { icon: UsersIcon, className: "bg-chart-4/10 text-chart-4" };
  }
  if (normalized.includes("gift")) {
    return { icon: GiftIcon, className: "bg-chart-5/10 text-chart-5" };
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
    return { icon: BanknoteIcon, className: "bg-chart-2 text-background" };
  }
  return { icon: WalletCardsIcon, className: "bg-muted text-foreground" };
}

function formatPaymentMethod(value: string | null) {
  if (!value) return "Other";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
