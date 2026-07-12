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
  const activeFilterCount =
    Number(filters.status !== "all") + Number(filters.personId !== "all");
  const selectedPerson = people.find((person) => person.id === filters.personId);
  const statusLabel =
    filters.status === "all"
      ? "All statuses"
      : filters.status.charAt(0) + filters.status.slice(1).toLowerCase();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search loans"
          placeholder="Search by loan or person"
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
            aria-label="Add loan filters"
          >
            <SlidersHorizontalIcon aria-hidden="true" data-icon="inline-start" />
            {activeFilterCount > 0
              ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
              : "Filters"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Add filters</p>
                <p className="text-muted-foreground text-xs">
                  Narrow loans by status or person.
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
                  Clear
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
              <SelectTrigger className="w-full" aria-label="Filter by status">
                <SelectValue placeholder={statusLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REPAID">Repaid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={filters.personId}
              onValueChange={(value) =>
                onChange({ ...filters, personId: value })
              }
            >
              <SelectTrigger className="w-full" aria-label="Filter by person">
                <SelectValue placeholder={selectedPerson?.name ?? "All people"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All people</SelectItem>
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
