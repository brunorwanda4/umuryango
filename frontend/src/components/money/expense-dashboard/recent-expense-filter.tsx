"use client";

import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type RecentExpenseFilterProps = {
  resultCount: number;
  search: string;
  totalCount: number;
  onSearchChange: (value: string) => void;
};

export function RecentExpenseFilter({
  resultCount,
  search,
  totalCount,
  onSearchChange,
}: RecentExpenseFilterProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 px-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <InputGroup className="sm:max-w-sm">
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
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-muted-foreground text-xs">
          Showing {resultCount} of {totalCount}
        </p>
      </div>
    </div>
  );
}
