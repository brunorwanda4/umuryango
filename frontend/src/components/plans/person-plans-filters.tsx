import { RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";
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
import { createTranslator } from "@/i18n/translate";
import { EMPTY_PLAN_FILTERS, type PlanFilters } from "./types-and-schemas";

export function PersonPlansFilters({
  filters,
  onChange,
}: {
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
}) {
  const t = createTranslator("PersonalPlans");
  const [isOpen, setIsOpen] = useState(false);

  const selectOptions = useMemo(
    () => ({
      type: [
        ["all", t((m) => m.PersonalPlans.filters.allTypes)],
        ["TASK", t((m) => m.PersonalPlans.filters.tasks)],
        ["LONG_TERM_GOAL", t((m) => m.PersonalPlans.filters.longTermGoals)],
      ],
      status: [
        ["all", t((m) => m.PersonalPlans.filters.allStatuses)],
        ["PENDING", t((m) => m.PersonalPlans.filters.pending)],
        ["IN_PROGRESS", t((m) => m.PersonalPlans.filters.inProgress)],
        ["COMPLETED", t((m) => m.PersonalPlans.filters.completed)],
        ["CANCELLED", t((m) => m.PersonalPlans.filters.cancelled)],
        ["OVERDUE", t((m) => m.PersonalPlans.filters.overdue)],
      ],
      priority: [
        ["all", t((m) => m.PersonalPlans.filters.allPriorities)],
        ["LOW", t((m) => m.PersonalPlans.filters.low)],
        ["MEDIUM", t((m) => m.PersonalPlans.filters.medium)],
        ["HIGH", t((m) => m.PersonalPlans.filters.high)],
      ],
    }),
    [t],
  );

  const filterAriaLabels = useMemo(
    () => ({
      type: t((m) => m.PersonalPlans.filters.filterByType),
      status: t((m) => m.PersonalPlans.filters.filterByStatus),
      priority: t((m) => m.PersonalPlans.filters.filterByPriority),
    }),
    [t],
  );

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
              aria-label={t((m) => m.PersonalPlans.filters.searchAria)}
              placeholder={t((m) => m.PersonalPlans.filters.searchPlaceholder)}
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
              aria-label={t((m) => m.PersonalPlans.filters.toggleFiltersAria)}
            >
              <SlidersHorizontalIcon
                aria-hidden="true"
                data-icon="inline-start"
              />
              <span>{t((m) => m.PersonalPlans.filters.toggleFilters)}</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
          <Button
            aria-label={t((m) => m.PersonalPlans.filters.resetFilters)}
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
            <SelectTrigger
              className="w-full"
              aria-label={filterAriaLabels[key]}
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
          aria-label={t((m) => m.PersonalPlans.filters.filterByDate)}
          className="w-full"
          placeholder={t((m) => m.PersonalPlans.filters.anyDate)}
          value={filters.date}
          onValueChange={(date) => onChange({ ...filters, date })}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
