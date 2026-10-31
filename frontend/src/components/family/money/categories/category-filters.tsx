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
        placeholder={t((m) => m.FamilyCategories.searchNameDesc)}
      />
      <Select
        value={typeFilter}
        onValueChange={(value) => setTypeFilter(value as "ALL" | CategoryType)}
      >
        <SelectTrigger
          aria-label={t((m) => m.FamilyCategories.filterTypeAria)}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">
              {t((m) => m.FamilyCategories.allTypes)}
            </SelectItem>
            <SelectItem value="INCOME">
              {t((m) => m.FamilyCategories.income)}
            </SelectItem>
            <SelectItem value="EXPENSE">
              {t((m) => m.FamilyCategories.expense)}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "ALL" | CategoryStatus)
        }
      >
        <SelectTrigger
          aria-label={t((m) => m.FamilyCategories.filterStatusAria)}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="ALL">
              {t((m) => m.FamilyCategories.allStatuses)}
            </SelectItem>
            <SelectItem value="ACTIVE">
              {t((m) => m.FamilyCategories.active)}
            </SelectItem>
            <SelectItem value="INACTIVE">
              {t((m) => m.FamilyCategories.inactive)}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={sort}
        onValueChange={(value) => setSort(value as CategorySort)}
      >
        <SelectTrigger
          aria-label={t((m) => m.FamilyCategories.sortAria)}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="updated-desc">
              {t((m) => m.FamilyCategories.sortUpdatedDesc)}
            </SelectItem>
            <SelectItem value="name-asc">
              {t((m) => m.FamilyCategories.sortNameAsc)}
            </SelectItem>
            <SelectItem value="transactions-desc">
              {t((m) => m.FamilyCategories.sortMostUsed)}
            </SelectItem>
            <SelectItem value="total-desc">
              {t((m) => m.FamilyCategories.sortHighestValue)}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
