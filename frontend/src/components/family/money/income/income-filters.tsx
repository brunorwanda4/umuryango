import { FilterXIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Card className="min-w-0 bg-card/50">
      <CardContent className="flex min-w-0 flex-col gap-4 p-4">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-6">
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Method Filter */}
          <Select
            value={filterPaymentMethod}
            onValueChange={setFilterPaymentMethod}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="REVERSED">Reversed</SelectItem>
            </SelectContent>
          </Select>

          {/* Member Filter */}
          <Select value={filterMember} onValueChange={setFilterMember}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {family.members.map((m) => (
                <SelectItem key={m.id} value={m.fullName}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="w-full"
          >
            <FilterXIcon className="size-4" data-icon="inline-start" />
            Reset Filters
          </Button>
        </div>

        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center">
          <span className="shrink-0 text-muted-foreground text-xs">
            Received date range:
          </span>
          <div className="flex min-w-0 w-full flex-wrap items-center gap-2 md:w-auto">
            <Input
              type="date"
              className="h-8 max-w-[160px] min-w-0"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-8 max-w-[160px] min-w-0"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
