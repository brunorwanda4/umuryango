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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyApprovals");
  const updateFilter = (key: keyof ApprovalFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t((m) => m.FamilyApprovals.filtersTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyApprovals.filtersDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            aria-label={t((m) => m.FamilyApprovals.searchApprovalsAria)}
            className="pl-9"
            placeholder={t((m) => m.FamilyApprovals.searchPlaceholder)}
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </div>
        <FilterSelect
          label={t((m) => m.FamilyApprovals.typeColumn)}
          value={filters.type}
          onChange={(value) => updateFilter("type", value)}
          options={[
            ["all", t((m) => m.FamilyApprovals.allTypes)],
            ["INCOME", t((m) => m.FamilyApprovals.incomeButton)],
            ["EXPENSE", t((m) => m.FamilyApprovals.expensesButton)],
            ["BUDGET", "Budget"],
            ["CONTRIBUTION", "Contribution"],
            ["TRANSACTION", "Transaction"],
            ["OTHER", "Other"],
          ]}
        />
        <FilterSelect
          label={t((m) => m.FamilyApprovals.statusColumn)}
          value={filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={[
            ["all", t((m) => m.FamilyApprovals.allStatuses)],
            ["PENDING", "Pending"],
            ["APPROVED", "Approved"],
            ["REJECTED", "Rejected"],
            ["CHANGES_REQUESTED", "Changes requested"],
            ["DRAFT", "Draft"],
          ]}
        />
        <FilterSelect
          label={t((m) => m.FamilyApprovals.categoryColumn)}
          value={filters.category}
          onChange={(value) => updateFilter("category", value)}
          options={[
            ["all", t((m) => m.FamilyApprovals.allCategories)],
            ...categories.map((category) => [category, category] as const),
          ]}
        />
        <FilterSelect
          label={t((m) => m.FamilyApprovals.requestedBy)}
          value={filters.requestedBy}
          onChange={(value) => updateFilter("requestedBy", value)}
          options={[
            ["all", t((m) => m.FamilyApprovals.allRequesters)],
            ...requesters.map((requester) => [requester, requester] as const),
          ]}
        />
        <Input
          aria-label={t((m) => m.FamilyApprovals.startDate)}
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter("startDate", event.target.value)}
        />
        <Input
          aria-label={t((m) => m.FamilyApprovals.endDate)}
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter("endDate", event.target.value)}
        />
        <Input
          aria-label={t((m) => m.FamilyApprovals.minAmount)}
          inputMode="numeric"
          placeholder={t((m) => m.FamilyApprovals.minAmount)}
          value={filters.minAmount}
          onChange={(event) => updateFilter("minAmount", event.target.value)}
        />
        <Input
          aria-label={t((m) => m.FamilyApprovals.maxAmount)}
          inputMode="numeric"
          placeholder={t((m) => m.FamilyApprovals.maxAmount)}
          value={filters.maxAmount}
          onChange={(event) => updateFilter("maxAmount", event.target.value)}
        />
        <FilterSelect
          label={t((m) => m.FamilyApprovals.priority)}
          value={filters.priority}
          onChange={(value) => updateFilter("priority", value)}
          options={[
            ["all", t((m) => m.FamilyApprovals.allPriorities)],
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
          {t((m) => m.FamilyApprovals.resetFilters)}
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
