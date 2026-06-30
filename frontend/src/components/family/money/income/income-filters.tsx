import { FilterXIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FamilyDetail } from "../../dashboard/types";
import type { Category } from "./types-and-schemas";

export function IncomeFilters({
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterPaymentMethod,
  setFilterPaymentMethod,
  filterStatus,
  setFilterStatus,
  filterMember,
  setFilterMember,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  categories,
  family,
}: {
  search: string;
  setSearch: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterMember: string;
  setFilterMember: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  resetFilters: () => void;
  categories: Category[];
  family: FamilyDetail;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search income title/payer..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Payments</option>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVERSED">Reversed</option>
          </select>

          {/* Member Filter */}
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Members</option>
            {family.members.map((m) => (
              <option key={m.id} value={m.fullName}>
                {m.fullName}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          <Button variant="outline" onClick={resetFilters} className="w-full">
            <FilterXIcon className="size-4" data-icon="inline-start" />
            Reset Filters
          </Button>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <span className="text-xs text-muted-foreground shrink-0">
            Received date range:
          </span>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              type="date"
              className="h-8 max-w-[160px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-8 max-w-[160px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
