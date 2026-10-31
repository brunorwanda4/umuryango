import {
  ChevronDownIcon,
  FilterXIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyIncome");
  const tCommon = createTranslator("Common");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const activeAdvancedFiltersCount = [
    filterCategory !== "all",
    filterPaymentMethod !== "all",
    filterStatus !== "all",
    filterMember !== "all",
    Boolean(startDate),
    Boolean(endDate),
  ].filter(Boolean).length;

  return (
    <Card className="min-w-0 bg-card/50">
      <CardContent className="flex min-w-0 flex-col gap-4 p-4">
        <Collapsible
          open={showMoreFilters}
          onOpenChange={setShowMoreFilters}
          className="flex min-w-0 flex-col gap-4"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t((m) => m.FamilyIncome.filters.searchPlaceholder)}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between sm:w-auto"
              >
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontalIcon
                    aria-hidden="true"
                    data-icon="inline-start"
                  />
                  {tCommon("filters.moreFilters") || "More filters"}
                  {activeAdvancedFiltersCount > 0
                    ? ` (${activeAdvancedFiltersCount})`
                    : null}
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  data-icon="inline-end"
                  className={
                    showMoreFilters
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="flex min-w-0 flex-col gap-4">
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-5">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t((m) => m.FamilyIncome.filters.allCategories)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t((m) => m.FamilyIncome.filters.allCategories)}
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterPaymentMethod}
                onValueChange={setFilterPaymentMethod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t((m) => m.FamilyIncome.filters.allPayments)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t((m) => m.FamilyIncome.filters.allPayments)}
                  </SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t((m) => m.FamilyIncome.filters.allStatuses)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t((m) => m.FamilyIncome.filters.allStatuses)}
                  </SelectItem>
                  <SelectItem value="PENDING">
                    {tCommon("status.pending")}
                  </SelectItem>
                  <SelectItem value="APPROVED">
                    {tCommon("status.approved")}
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    {tCommon("status.rejected")}
                  </SelectItem>
                  <SelectItem value="REVERSED">
                    {tCommon("status.reversed")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t((m) => m.FamilyIncome.filters.allMembers)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t((m) => m.FamilyIncome.filters.allMembers)}
                  </SelectItem>
                  {family.members.map((m) => (
                    <SelectItem key={m.id} value={m.fullName}>
                      {m.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                <FilterXIcon className="size-4" data-icon="inline-start" />
                {t((m) => m.FamilyIncome.filters.resetFilters)}
              </Button>
            </div>

            <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center">
              <span className="shrink-0 text-muted-foreground text-xs">
                Received date range:
              </span>
              <div className="flex min-w-0 w-full flex-row items-center gap-2 md:w-auto">
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
