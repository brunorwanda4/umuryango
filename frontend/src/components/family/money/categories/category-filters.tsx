import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CategorySort,
  CategoryStatus,
  CategoryType,
} from "./types-and-constants";

export function CategoryFilters({
  search,
  setSearch,
  setSort,
  setStatusFilter,
  setTypeFilter,
  sort,
  statusFilter,
  typeFilter,
}: {
  search: string;
  setSearch: (value: string) => void;
  setSort: (value: CategorySort) => void;
  setStatusFilter: (value: "ALL" | CategoryStatus) => void;
  setTypeFilter: (value: "ALL" | CategoryType) => void;
  sort: CategorySort;
  statusFilter: "ALL" | CategoryStatus;
  typeFilter: "ALL" | CategoryType;
}) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_14rem]">
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search categories"
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or description"
          value={search}
        />
      </div>
      <Select
        value={typeFilter}
        onValueChange={(value) => setTypeFilter(value as "ALL" | CategoryType)}
      >
        <SelectTrigger aria-label="Filter by type" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "ALL" | CategoryStatus)
        }
      >
        <SelectTrigger aria-label="Filter by status" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={sort}
        onValueChange={(value) => setSort(value as CategorySort)}
      >
        <SelectTrigger aria-label="Sort categories" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="updated-desc">Last updated</SelectItem>
            <SelectItem value="name-asc">Name A to Z</SelectItem>
            <SelectItem value="transactions-desc">Most used</SelectItem>
            <SelectItem value="total-desc">Highest value</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
