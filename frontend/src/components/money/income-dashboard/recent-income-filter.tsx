"use client";

import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTranslator } from "@/i18n/translate";

type RecentIncomeFilterProps = {
  category: string;
  categoryOptions: { id: string; name: string }[];
  paymentMethod: string;
  resultCount: number;
  search: string;
  totalCount: number;
  onCategoryChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export function RecentIncomeFilter({
  category,
  categoryOptions,
  paymentMethod,
  resultCount,
  search,
  totalCount,
  onCategoryChange,
  onPaymentMethodChange,
  onSearchChange,
}: RecentIncomeFilterProps) {
  const t = createTranslator("PersonalMoney.personalIncome");
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 px-5 pb-4 sm:px-6">
      <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
        <InputGroup className="sm:max-w-sm sm:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={t(
              (m) => m.PersonalMoney.personalIncome.filters.searchAria,
            )}
            placeholder={t(
              (m) => m.PersonalMoney.personalIncome.filters.searchPlaceholder,
            )}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {hasSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label={t(
                  (m) => m.PersonalMoney.personalIncome.filters.clearSearchAria,
                )}
                size="icon-xs"
                type="button"
                variant="ghost"
                onClick={() => onSearchChange("")}
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:contents">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger
              className="w-full min-w-0 sm:w-44"
              aria-label={t(
                (m) =>
                  m.PersonalMoney.personalIncome.filters.filterCategoryAria,
              )}
            >
              <SelectValue
                placeholder={t(
                  (m) =>
                    m.PersonalMoney.personalIncome.filters.categoryPlaceholder,
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t((m) => m.PersonalMoney.personalIncome.filters.allCategories)}
              </SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger
              className="w-full min-w-0 sm:w-44"
              aria-label={t(
                (m) =>
                  m.PersonalMoney.personalIncome.filters
                    .filterPaymentMethodAria,
              )}
            >
              <SelectValue
                placeholder={t(
                  (m) =>
                    m.PersonalMoney.personalIncome.filters
                      .paymentMethodPlaceholder,
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t(
                  (m) =>
                    m.PersonalMoney.personalIncome.filters.allPaymentMethods,
                )}
              </SelectItem>
              <SelectItem value="MOBILE_MONEY">
                {t((m) => m.PersonalMoney.personalIncome.filters.mobileMoney)}
              </SelectItem>
              <SelectItem value="BANK_TRANSFER">
                {t((m) => m.PersonalMoney.personalIncome.filters.bankTransfer)}
              </SelectItem>
              <SelectItem value="CASH">
                {t((m) => m.PersonalMoney.personalIncome.filters.cash)}
              </SelectItem>
              <SelectItem value="SAVINGS_WALLET">
                {t((m) => m.PersonalMoney.personalIncome.filters.savingsWallet)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-muted-foreground text-xs">
          {t((m) => m.PersonalMoney.personalIncome.filters.showingCount, {
            count: resultCount,
            total: totalCount,
          })}
        </p>
      </div>
    </div>
  );
}
