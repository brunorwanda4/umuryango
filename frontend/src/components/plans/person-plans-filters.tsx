import { RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/calendar-day";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(false);

  const isFiltered =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_PLAN_FILTERS);

  const activeAdvancedFilterCount =
    Number(filters.type !== "all") +
    Number(filters.status !== "all") +
    Number(filters.priority !== "all") +
    Number(filters.date !== "");

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
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
        </div>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-center sm:w-auto"
              aria-label="Toggle advanced filters"
            >
              <SlidersHorizontalIcon
                aria-hidden="true"
                data-icon="inline-start"
              />
              <span>Filters</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
          <Button
            aria-label="Reset filters"
            disabled={!isFiltered}
            size="icon"
            variant="outline"
            onClick={() => onChange(EMPTY_PLAN_FILTERS)}
          >
            <RotateCcwIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      <CollapsibleContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {(["type", "status", "priority"] as const).map((key) => (
          <Select
            key={key}
            value={filters[key]}
            onValueChange={(value) => onChange({ ...filters, [key]: value })}
          >
            <SelectTrigger className="w-full" aria-label={`Filter by ${key}`}>
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
          className="w-full"
          placeholder="Any date"
          value={filters.date}
          onValueChange={(date) => onChange({ ...filters, date })}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
