"use client";

import { FilterXIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createTranslator } from "@/i18n/translate";
import {
  type LoanFiltersState,
  loanStatuses,
  loanTypes,
} from "./types-and-schemas";

export function LoanFilters({
  borrowers,
  currency,
  filters,
  lenders,
  onChange,
  onReset,
}: {
  borrowers: string[];
  currency: string;
  filters: LoanFiltersState;
  lenders: string[];
  onChange: (filters: LoanFiltersState) => void;
  onReset: () => void;
}) {
  const t = createTranslator("FamilyLoans");
  const update = (patch: Partial<LoanFiltersState>) =>
    onChange({ ...filters, ...patch });

  return (
    <Card className="bg-card/50">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div className="relative md:col-span-2 xl:col-span-2">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t((m) => m.FamilyLoans.searchPlaceholder)}
              className="pl-8"
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
            />
          </div>
          <Select
            value={filters.type}
            onValueChange={(type) =>
              update({ type: type as LoanFiltersState["type"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t((m) => m.FamilyLoans.allLoanTypes)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyLoans.allLoanTypes)}
              </SelectItem>
              {loanTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(status) =>
              update({ status: status as LoanFiltersState["status"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t((m) => m.FamilyLoans.allStatuses)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyLoans.allStatuses)}
              </SelectItem>
              {loanStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.borrower}
            onValueChange={(borrower) => update({ borrower })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t((m) => m.FamilyLoans.allBorrowers)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyLoans.allBorrowers)}
              </SelectItem>
              {borrowers.map((borrower) => (
                <SelectItem key={borrower} value={borrower}>
                  {borrower}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.lender}
            onValueChange={(lender) => update({ lender })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t((m) => m.FamilyLoans.allLenders)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyLoans.allLenders)}
              </SelectItem>
              {lenders.map((lender) => (
                <SelectItem key={lender} value={lender}>
                  {lender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            inputMode="numeric"
            placeholder={`Min amount (${currency})`}
            value={filters.minAmount}
            onChange={(event) => update({ minAmount: event.target.value })}
          />
          <Input
            inputMode="numeric"
            placeholder={`Max amount (${currency})`}
            value={filters.maxAmount}
            onChange={(event) => update({ maxAmount: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-muted-foreground text-xs">
              Start date:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={filters.startDate}
                onChange={(event) => update({ startDate: event.target.value })}
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={filters.endDate}
                onChange={(event) => update({ endDate: event.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-muted-foreground text-xs">
              Due date:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={filters.dueStartDate}
                onChange={(event) =>
                  update({ dueStartDate: event.target.value })
                }
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                className="h-8 max-w-[160px]"
                value={filters.dueEndDate}
                onChange={(event) => update({ dueEndDate: event.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm xl:min-w-40">
            <span id="loan-overdue-filter-label">
              {t((m) => m.FamilyLoans.overdueOnly)}
            </span>
            <Switch
              aria-labelledby="loan-overdue-filter-label"
              checked={filters.overdueOnly}
              onCheckedChange={(overdueOnly) => update({ overdueOnly })}
              size="sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full xl:w-auto"
          >
            <FilterXIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyLoans.resetFiltersBtn)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
