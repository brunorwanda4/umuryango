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
  const t = createTranslator("FamilyExpenses");
  const tCommon = createTranslator("Common");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const activeAdvancedFiltersCount = [
    filterCategory !== "all",
    filterPaymentMethod !== "all",
    filterStatus !== "all",
    filterMember !== "all",
    Boolean(startDate),
    Boolean(endDate),
    Boolean(minAmount),
    Boolean(maxAmount),
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
              <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                className="pl-8"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                  {t("filters.moreFilters")}
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
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("filters.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allCategories")}
                  </SelectItem>
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
                  <SelectValue placeholder={t("filters.allPayments")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allPayments")}
                  </SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("filters.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="DRAFT">
                    {tCommon("status.draft")}
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
                  <SelectValue placeholder={t("filters.allMembers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allMembers")}</SelectItem>
                  {family.members.map((member) => (
                    <SelectItem key={member.id} value={member.fullName}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                inputMode="numeric"
                placeholder={t("filters.minAmount", {
                  currency: family.defaultCurrency,
                })}
                value={minAmount}
                onChange={(event) => setMinAmount(event.target.value)}
              />
              <Input
                inputMode="numeric"
                placeholder={t("filters.maxAmount", {
                  currency: family.defaultCurrency,
                })}
                value={maxAmount}
                onChange={(event) => setMaxAmount(event.target.value)}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <span className="shrink-0 text-muted-foreground text-xs">
                  {t("filters.dateRange")}
                </span>
                <div className="flex min-w-0 w-full flex-wrap items-center gap-2 md:w-auto">
                  <Input
                    type="date"
                    className="h-8 max-w-[160px] min-w-0"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <span className="text-muted-foreground text-xs">
                    {t("filters.to")}
                  </span>
                  <Input
                    type="date"
                    className="h-8 max-w-[160px] min-w-0"
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
                {t("filters.resetFilters")}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
