import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
import type {
  PersonalLoanFilters,
  PersonalLoanStatus,
} from "./types-and-schemas";

export function LoanFilters({
  filters,
  people,
  onChange,
}: {
  filters: PersonalLoanFilters;
  people: { id: string; name: string }[];
  onChange: (filters: PersonalLoanFilters) => void;
}) {
  const t = createTranslator("PersonalLoans");
  const activeFilterCount =
    Number(filters.status !== "all") + Number(filters.personId !== "all");
  const selectedPerson = people.find(
    (person) => person.id === filters.personId,
  );
  const statusLabel =
    filters.status === "all"
      ? t("filters.allStatuses")
      : filters.status === "ACTIVE"
        ? t("filters.active")
        : filters.status === "REPAID"
          ? t("filters.repaid")
          : filters.status === "OVERDUE"
            ? t("filters.overdue")
            : t("filters.cancelled");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t("filters.searchAria")}
          placeholder={t("filters.searchPlaceholder")}
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </InputGroup>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-center sm:w-auto"
            aria-label={t("filters.addFiltersAria")}
          >
            <SlidersHorizontalIcon
              aria-hidden="true"
              data-icon="inline-start"
            />
            {activeFilterCount > 0
              ? t("filters.filtersCount", {
                  count: activeFilterCount,
                })
              : t("filters.filters")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{t("filters.addFilters")}</p>
                <p className="text-muted-foreground text-xs">
                  {t("filters.narrowDesc")}
                </p>
              </div>
              {activeFilterCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({ ...filters, status: "all", personId: "all" })
                  }
                >
                  <XIcon aria-hidden="true" data-icon="inline-start" />
                  {t("filters.clear")}
                </Button>
              ) : null}
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  status: value as "all" | PersonalLoanStatus,
                })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("filters.filterByStatusAria")}
              >
                <SelectValue placeholder={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    {t("filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="ACTIVE">{t("filters.active")}</SelectItem>
                  <SelectItem value="REPAID">{t("filters.repaid")}</SelectItem>
                  <SelectItem value="OVERDUE">
                    {t("filters.overdue")}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t("filters.cancelled")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={filters.personId}
              onValueChange={(value) =>
                onChange({ ...filters, personId: value })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("filters.filterByPersonAria")}
              >
                <SelectValue
                  placeholder={selectedPerson?.name ?? t("filters.allPeople")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t("filters.allPeople")}</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
