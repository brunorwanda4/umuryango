import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ContactFiltersState,
  contactStatusOptions,
  contactTypeOptions,
} from "./types-and-schemas";

export interface ContactFiltersProps {
  filters: ContactFiltersState;
  onFiltersChange: React.Dispatch<React.SetStateAction<ContactFiltersState>>;
  onReset: () => void;
}

export function ContactFilters({
  filters,
  onFiltersChange,
  onReset,
}: ContactFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search and filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_10rem]">
        <div className="relative">
          <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
            placeholder="Search contacts"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.contactType}
          onValueChange={(value) =>
            onFiltersChange((current) => ({
              ...current,
              contactType: value as ContactFiltersState["contactType"],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Contact type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {contactTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange((current) => ({
              ...current,
              status: value as ContactFiltersState["status"],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {contactStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-4 lg:col-span-3">
          <Label className="flex items-center gap-2">
            <Checkbox
              checked={filters.emergencyOnly}
              onCheckedChange={(checked) =>
                onFiltersChange((current) => ({
                  ...current,
                  emergencyOnly: Boolean(checked),
                }))
              }
            />
            Emergency only
          </Label>
          <Label className="flex items-center gap-2">
            <Checkbox
              checked={filters.loanOnly}
              onCheckedChange={(checked) =>
                onFiltersChange((current) => ({
                  ...current,
                  loanOnly: Boolean(checked),
                }))
              }
            />
            Loan contacts only
          </Label>
          <Button size="sm" variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
