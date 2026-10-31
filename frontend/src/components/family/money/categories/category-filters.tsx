import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
import { CategorySearch } from "./category-search";
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
  const t = createTranslator("FamilyCategories");

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(16rem,1fr)_12rem_12rem_14rem]">
      <CategorySearch
        value={search}
        onChange={setSearch}
        placeholder={t("searchNameDesc")}
      />
      <Select
        value={typeFilter}
        onValueChange={(value) => setTypeFilter(value as "ALL" | CategoryType)}
      >
        <SelectTrigger aria-label={t("filterTypeAria")} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">{t("allTypes")}</SelectItem>
            <SelectItem value="INCOME">{t("income")}</SelectItem>
            <SelectItem value="EXPENSE">{t("expense")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "ALL" | CategoryStatus)
        }
      >
        <SelectTrigger aria-label={t("filterStatusAria")} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            <SelectItem value="ACTIVE">{t("active")}</SelectItem>
            <SelectItem value="INACTIVE">{t("inactive")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={sort}
        onValueChange={(value) => setSort(value as CategorySort)}
      >
        <SelectTrigger aria-label={t("sortAria")} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="updated-desc">{t("sortUpdatedDesc")}</SelectItem>
            <SelectItem value="name-asc">{t("sortNameAsc")}</SelectItem>
            <SelectItem value="transactions-desc">
              {t("sortMostUsed")}
            </SelectItem>
            <SelectItem value="total-desc">{t("sortHighestValue")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
