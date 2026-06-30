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
import { paymentMethods } from "./types-and-schemas";

export function ExpenseFilters({
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
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  resetFilters,
  categories,
  family,
}: {
  search: string;
  setSearch: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterMember: string;
  setFilterMember: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  minAmount: string;
  setMinAmount: (value: string) => void;
  maxAmount: string;
  setMaxAmount: (value: string) => void;
  resetFilters: () => void;
  categories: Category[];
  family: FamilyDetail;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <div className="relative md:col-span-2 xl:col-span-1">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search title, payee, notes..."
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterPaymentMethod}
            onValueChange={setFilterPaymentMethod}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="REVERSED">Reversed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterMember} onValueChange={setFilterMember}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {family.members.map((member) => (
                <SelectItem key={member.id} value={member.fullName}>
                  {member.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            inputMode="numeric"
            placeholder={`Min amount (${family.defaultCurrency})`}
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
          />
          <Input
            inputMode="numeric"
            placeholder={`Max amount (${family.defaultCurrency})`}
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-muted-foreground text-xs">
              Expense date range:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="w-full md:w-auto"
          >
            <FilterXIcon className="size-4" data-icon="inline-start" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
