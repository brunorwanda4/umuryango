import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
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
import { createTranslator } from "@/i18n/translate";
import {
  type ContactFiltersState,
  contactStatusOptions,
  contactTypeOptions,
} from "./types-and-schemas";

const t = createTranslator("FamilyContacts");
const tCommon = createTranslator("Common");

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
    <div className="border-b px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="relative min-w-0 flex-1 basis-full md:basis-64">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) =>
                onFiltersChange((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder={t((m) => m.FamilyContacts.searchPlaceholder)}
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
            <SelectTrigger className="min-w-0 flex-1 basis-32 md:w-52 md:flex-none">
              <SelectValue
                placeholder={t((m) => m.FamilyContacts.contactTypePlaceholder)}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyContacts.allTypes)}
              </SelectItem>
              {contactTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`types.${option.value}`)}
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
            <SelectTrigger className="min-w-0 flex-1 basis-32 md:w-44 md:flex-none">
              <SelectValue
                placeholder={t((m) => m.FamilyContacts.filterStatus)}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.FamilyContacts.allStatuses)}
              </SelectItem>
              {contactStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`statuses.${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Label
            htmlFor="contacts-emergency-only"
            className="flex items-center gap-2"
          >
            <Checkbox
              id="contacts-emergency-only"
              checked={filters.emergencyOnly}
              onCheckedChange={(checked) =>
                onFiltersChange((current) => ({
                  ...current,
                  emergencyOnly: Boolean(checked),
                }))
              }
            />
            {t((m) => m.FamilyContacts.emergencyOnly)}
          </Label>
          <Label
            htmlFor="contacts-loan-only"
            className="flex items-center gap-2"
          >
            <Checkbox
              id="contacts-loan-only"
              checked={filters.loanOnly}
              onCheckedChange={(checked) =>
                onFiltersChange((current) => ({
                  ...current,
                  loanOnly: Boolean(checked),
                }))
              }
            />
            {t((m) => m.FamilyContacts.loanOnly)}
          </Label>
          <Button size="sm" variant="outline" onClick={onReset}>
            {tCommon((m) => m.Common.reset)}
          </Button>
        </div>
      </div>
    </div>
  );
}
