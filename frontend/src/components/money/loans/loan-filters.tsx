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
      ? t((m) => m.PersonalLoans.filters.allStatuses)
      : filters.status === "ACTIVE"
        ? t((m) => m.PersonalLoans.filters.active)
        : filters.status === "REPAID"
          ? t((m) => m.PersonalLoans.filters.repaid)
          : filters.status === "OVERDUE"
            ? t((m) => m.PersonalLoans.filters.overdue)
            : t((m) => m.PersonalLoans.filters.cancelled);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t((m) => m.PersonalLoans.filters.searchAria)}
          placeholder={t((m) => m.PersonalLoans.filters.searchPlaceholder)}
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
            aria-label={t((m) => m.PersonalLoans.filters.addFiltersAria)}
          >
            <SlidersHorizontalIcon
              aria-hidden="true"
              data-icon="inline-start"
            />
            {activeFilterCount > 0
              ? t((m) => m.PersonalLoans.filters.filtersCount, {
                  count: activeFilterCount,
                })
              : t((m) => m.PersonalLoans.filters.filters)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">
                  {t((m) => m.PersonalLoans.filters.addFilters)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t((m) => m.PersonalLoans.filters.narrowDesc)}
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
                  {t((m) => m.PersonalLoans.filters.clear)}
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
                aria-label={t(
                  (m) => m.PersonalLoans.filters.filterByStatusAria,
                )}
              >
                <SelectValue placeholder={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    {t((m) => m.PersonalLoans.filters.allStatuses)}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {t((m) => m.PersonalLoans.filters.active)}
                  </SelectItem>
                  <SelectItem value="REPAID">
                    {t((m) => m.PersonalLoans.filters.repaid)}
                  </SelectItem>
                  <SelectItem value="OVERDUE">
                    {t((m) => m.PersonalLoans.filters.overdue)}
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    {t((m) => m.PersonalLoans.filters.cancelled)}
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
                aria-label={t(
                  (m) => m.PersonalLoans.filters.filterByPersonAria,
                )}
              >
                <SelectValue
                  placeholder={
                    selectedPerson?.name ??
                    t((m) => m.PersonalLoans.filters.allPeople)
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">
                    {t((m) => m.PersonalLoans.filters.allPeople)}
                  </SelectItem>
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
