import { RotateCcwIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/calendar-day";
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
import { EMPTY_PLAN_FILTERS, type PlanFilters } from "./types-and-schemas";

const selectOptions = {
  type: [
    ["all", "All types"],
    ["TASK", "Tasks"],
    ["LONG_TERM_GOAL", "Long-term goals"],
  ],
  status: [
    ["all", "All statuses"],
    ["PENDING", "Pending"],
    ["IN_PROGRESS", "In progress"],
    ["COMPLETED", "Completed"],
    ["CANCELLED", "Cancelled"],
    ["OVERDUE", "Overdue"],
  ],
  priority: [
    ["all", "All priorities"],
    ["LOW", "Low"],
    ["MEDIUM", "Medium"],
    ["HIGH", "High"],
  ],
} as const;

export function PersonPlansFilters({
  filters,
  onChange,
}: {
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
}) {
  const isFiltered =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_PLAN_FILTERS);

  return (
    <section
      aria-label="Plan filters"
      className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_repeat(4,auto)]"
    >
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search plans"
          placeholder="Search by title"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </InputGroup>
      {(["type", "status", "priority"] as const).map((key) => (
        <Select
          key={key}
          value={filters[key]}
          onValueChange={(value) => onChange({ ...filters, [key]: value })}
        >
          <SelectTrigger
            className="w-full md:w-40"
            aria-label={`Filter by ${key}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectOptions[key].map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ))}
      <DatePickerInput
        aria-label="Filter by date"
        className="w-full md:w-40"
        placeholder="Any date"
        value={filters.date}
        onValueChange={(date) => onChange({ ...filters, date })}
      />
      <Button
        aria-label="Reset filters"
        disabled={!isFiltered}
        size="icon"
        variant="outline"
        onClick={() => onChange(EMPTY_PLAN_FILTERS)}
      >
        <RotateCcwIcon aria-hidden="true" />
      </Button>
    </section>
  );
}
