"use client";

import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecentExpenseFilterProps = {
  category: string;
  categoryOptions: { id: string; name: string }[];
  paymentMethod: string;
  resultCount: number;
  search: string;
  totalCount: number;
  onCategoryChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export function RecentExpenseFilter({
  category,
  categoryOptions,
  paymentMethod,
  resultCount,
  search,
  totalCount,
  onCategoryChange,
  onPaymentMethodChange,
  onSearchChange,
}: RecentExpenseFilterProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 px-5 pb-4 sm:px-6">
      <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
        <InputGroup className="sm:max-w-sm sm:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search recent expenses"
            placeholder="Search expenses"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {hasSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Clear expense search"
                size="icon-xs"
                type="button"
                variant="ghost"
                onClick={() => onSearchChange("")}
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:contents">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger
              aria-label="Filter by category"
              className="w-full min-w-0 sm:w-44"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger
              aria-label="Filter by payment method"
              className="w-full min-w-0 sm:w-44"
            >
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payment methods</SelectItem>
              <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="SAVINGS_WALLET">Savings Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-muted-foreground text-xs">
          Showing {resultCount} of {totalCount}
        </p>
      </div>
    </div>
  );
}
