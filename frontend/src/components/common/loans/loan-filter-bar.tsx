import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";
import type { SharedLoanFiltersState } from "./types";

export function LoanFilterBar({
  filters,
  onFiltersChange,
  counterparties = [],
}: {
  filters: SharedLoanFiltersState;
  onFiltersChange: (filters: SharedLoanFiltersState) => void;
  counterparties?: Array<{ id: string; name: string }>;
}) {
  const t = createTranslator("SharedLoans");
  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.status !== "all" ||
    filters.counterpartyId !== "all";

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-0">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          placeholder={t((m) => m.SharedLoans.searchPlaceholder)}
          className="pl-8 h-9 text-xs border-border bg-card focus-visible:ring-1"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              status: val as SharedLoanFiltersState["status"],
            })
          }
        >
          <SelectTrigger className="h-9 text-xs border-border bg-card min-w-[125px]">
            <SelectValue placeholder={t((m) => m.SharedLoans.statusAll)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t((m) => m.SharedLoans.statusAll)}
            </SelectItem>
            <SelectItem value="ACTIVE">
              {t((m) => m.SharedLoans.statusActive)}
            </SelectItem>
            <SelectItem value="OVERDUE">
              {t((m) => m.SharedLoans.statusOverdue)}
            </SelectItem>
            <SelectItem value="REPAID">
              {t((m) => m.SharedLoans.statusRepaid)}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Counterparty Filter (if multiple) */}
        {counterparties.length > 0 ? (
          <Select
            value={filters.counterpartyId}
            onValueChange={(val) =>
              onFiltersChange({ ...filters, counterpartyId: val })
            }
          >
            <SelectTrigger className="h-9 text-xs border-border bg-card min-w-[135px] max-w-[170px] truncate">
              <SelectValue
                placeholder={t((m) => m.SharedLoans.allCounterparties)}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.SharedLoans.allCounterparties)}
              </SelectItem>
              {counterparties.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {/* Reset Filter Button */}
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                ...filters,
                search: "",
                status: "all",
                counterpartyId: "all",
              })
            }
            className="h-9 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            {t((m) => m.SharedLoans.clearFilters)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
