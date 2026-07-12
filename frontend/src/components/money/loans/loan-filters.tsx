import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_12rem_14rem]">
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
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onChange({ ...filters, status: value as "all" | PersonalLoanStatus })
        }
      >
        <SelectTrigger className="w-full" aria-label="Filter by status">
          <SlidersHorizontalIcon aria-hidden="true" />
          <SelectValue placeholder="All statuses" />
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
        onValueChange={(value) => onChange({ ...filters, personId: value })}
      >
        <SelectTrigger className="w-full" aria-label="Filter by person">
          <SelectValue placeholder="All people" />
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
  );
}
