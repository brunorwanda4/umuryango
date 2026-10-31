"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { type ComponentProps, forwardRef, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createTranslator } from "@/i18n/translate";
import {
  formatLucideIconName,
  getLucideIcon,
  isLucideIconName,
  lucideIconOptions,
  normalizeLucideIconName,
} from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";

type LucideIconPickerProps = Omit<
  ComponentProps<typeof Button>,
  "onChange" | "value"
> & {
  value?: string | null;
  placeholder?: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
};

export const LucideIconPicker = forwardRef<
  HTMLButtonElement,
  LucideIconPickerProps
>(function LucideIconPicker(
  {
    value,
    placeholder,
    invalid = false,
    disabled,
    className,
    onBlur,
    onValueChange,
    ...props
  },
  ref,
) {
  const t = createTranslator("Common");
  const effectivePlaceholder = placeholder ?? t((m) => m.Common.selectIcon);
  const [open, setOpen] = useState(false);
  const normalizedValue = normalizeLucideIconName(value);
  const selectedIcon = useMemo(
    () => lucideIconOptions.find((option) => option.name === normalizedValue),
    [normalizedValue],
  );
  const SelectedIcon = getLucideIcon(value);
  const selectedLabel =
    selectedIcon?.label ??
    (value ? formatLucideIconName(value) : effectivePlaceholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          {...props}
          ref={ref}
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
          onBlur={onBlur}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-2">
            <SelectedIcon aria-hidden="true" data-icon="inline-start" />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronsUpDownIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder={t((m) => m.Common.searchIcons)} />
          <CommandList className="max-h-80">
            <CommandEmpty>{t((m) => m.Common.noIconFound)}</CommandEmpty>
            <CommandGroup>
              {lucideIconOptions.map((option) => {
                const checked =
                  isLucideIconName(value) && normalizedValue === option.name;
                const Icon = option.Icon;

                return (
                  <CommandItem
                    data-checked={checked}
                    key={option.name}
                    keywords={[option.name, option.label]}
                    onSelect={() => {
                      onValueChange(option.name);
                      setOpen(false);
                    }}
                    value={option.searchValue}
                  >
                    <Icon aria-hidden="true" />
                    <span className="truncate">{option.label}</span>
                    <span className="ml-auto text-muted-foreground text-xs">
                      {option.name}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
