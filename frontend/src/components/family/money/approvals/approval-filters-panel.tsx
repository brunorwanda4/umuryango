import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApprovalFilters } from "./types";

export function ApprovalFiltersPanel({
  categories,
  filters,
  requesters,
  onFiltersChange,
  onReset,
}: {
  categories: string[];
  filters: ApprovalFilters;
  requesters: string[];
  onFiltersChange: (filters: ApprovalFilters) => void;
  onReset: () => void;
}) {
  const updateFilter = (key: keyof ApprovalFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Narrow the queue by type, status, people, dates, amount, and priority.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search approvals"
            className="pl-9"
            placeholder="Search title, category, requester..."
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </div>
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(value) => updateFilter("type", value)}
          options={[
            ["all", "All types"],
            ["INCOME", "Income"],
            ["EXPENSE", "Expense"],
            ["BUDGET", "Budget"],
            ["CONTRIBUTION", "Contribution"],
            ["TRANSACTION", "Transaction"],
            ["OTHER", "Other"],
          ]}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={[
            ["all", "All statuses"],
            ["PENDING", "Pending"],
            ["APPROVED", "Approved"],
            ["REJECTED", "Rejected"],
            ["CHANGES_REQUESTED", "Changes requested"],
            ["DRAFT", "Draft"],
          ]}
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          onChange={(value) => updateFilter("category", value)}
          options={[
            ["all", "All categories"],
            ...categories.map((category) => [category, category] as const),
          ]}
        />
        <FilterSelect
          label="Requested By"
          value={filters.requestedBy}
          onChange={(value) => updateFilter("requestedBy", value)}
          options={[
            ["all", "All requesters"],
            ...requesters.map((requester) => [requester, requester] as const),
          ]}
        />
        <Input
          aria-label="Start date"
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter("startDate", event.target.value)}
        />
        <Input
          aria-label="End date"
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter("endDate", event.target.value)}
        />
        <Input
          aria-label="Minimum amount"
          inputMode="numeric"
          placeholder="Min amount"
          value={filters.minAmount}
          onChange={(event) => updateFilter("minAmount", event.target.value)}
        />
        <Input
          aria-label="Maximum amount"
          inputMode="numeric"
          placeholder="Max amount"
          value={filters.maxAmount}
          onChange={(event) => updateFilter("maxAmount", event.target.value)}
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(value) => updateFilter("priority", value)}
          options={[
            ["all", "All priorities"],
            ["LOW", "Low"],
            ["NORMAL", "Normal"],
            ["HIGH", "High"],
            ["URGENT", "Urgent"],
          ]}
        />
        <Button
          className="sm:col-start-auto"
          type="button"
          variant="outline"
          onClick={onReset}
        >
          Reset filters
        </Button>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [string, string])[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
