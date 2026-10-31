"use client";

import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { EditCategoryFormValues } from "./types-and-constants";

/**
 * Color presets for category form fields.
 * Exported so dialogs can reference the first option as a default value.
 */
export const colorOptions = [
  { label: "Slate", value: "var(--muted-foreground)" },
  { label: "Primary", value: "var(--primary)" },
  { label: "Chart 1", value: "var(--chart-1)" },
  { label: "Chart 2", value: "var(--chart-2)" },
  { label: "Chart 3", value: "var(--chart-3)" },
  { label: "Chart 4", value: "var(--chart-4)" },
  { label: "Chart 5", value: "var(--chart-5)" },
] as const;

function getColorInputValue(value: unknown) {
  const color = typeof value === "string" ? value : "";
  // Only return a valid hex for the native color input; CSS vars are handled by presets
  return /^#[\da-f]{6}$/i.test(color) ? color : "#111111";
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value);
}

type CategoryFormFieldsProps = {
  control: Control<EditCategoryFormValues>;
  showStatus?: boolean;
};

/**
 * Shared field layout for both Create and Edit category dialogs.
 *
 * Render this inside a <form> with:
 *   className="grid grid-cols-1 sm:grid-cols-2 gap-4"
 *
 * Status and Description span full width via col-span-full.
 */
export function CategoryFormFields({
  control,
  showStatus = true,
}: CategoryFormFieldsProps) {
  const t = createTranslator("FamilyCategories");

  return (
    <>
      <CommonFormField
        control={control}
        name="name"
        label={t("categoryName")}
        placeholder="e.g. Food"
        required
      />

      <CommonFormField
        control={control}
        name="type"
        label={t("categoryType")}
        fieldType="select"
        selectOptions={[
          { label: t("expense"), value: "EXPENSE" },
          { label: t("income"), value: "INCOME" },
        ]}
        required
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <CommonFormField
          control={control}
          name="icon"
          label={t("icon")}
          fieldType="lucide-icon"
          placeholder={t("searchPlaceholder")}
          required
        />

        {showStatus ? (
          <CommonFormField
            control={control}
            name="status"
            label={t("table.status")}
            fieldType="select"
            selectOptions={[
              { label: t("active"), value: "ACTIVE" },
              { label: t("inactive"), value: "INACTIVE" },
            ]}
            required
            description="Inactive categories stay in history but should not be selected for new transactions."
            fieldClassName="col-span-full"
          />
        ) : null}
      </div>
      <CommonFormField
        control={control}
        name="color"
        label={t("color")}
        fieldType="custom"
        required
        description="Choose a preset or use a custom color for category lists and future reports."
        render={({ field, id, invalid, disabled }) => {
          const selectedColor = field.value?.toString() ?? "";
          const isPreset = colorOptions.some((o) => o.value === selectedColor);
          const isHex = isHexColor(selectedColor);

          return (
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((option) => {
                  const selected = selectedColor === option.value;

                  return (
                    <Button
                      aria-label={t("useColorAria", { label: option.label })}
                      aria-pressed={selected}
                      className={cn(
                        "size-8 rounded-full border-border p-0",
                        selected && "ring-2 ring-ring ring-offset-2",
                      )}
                      disabled={disabled}
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                      type="button"
                      variant="outline"
                    >
                      <span
                        aria-hidden="true"
                        className="size-5 rounded-full border"
                        style={{ backgroundColor: option.value }}
                      />
                    </Button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  aria-invalid={invalid}
                  className="h-10 w-16 cursor-pointer p-1"
                  disabled={disabled}
                  id={id}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(event) => field.onChange(event.target.value)}
                  ref={field.ref}
                  type="color"
                  value={getColorInputValue(selectedColor)}
                />
                <span className="text-muted-foreground text-xs">
                  {isPreset
                    ? t("colorPresetSelected")
                    : isHex
                      ? selectedColor
                      : t("colorCustomPick")}
                </span>
              </div>
            </div>
          );
        }}
      />

      <CommonFormField
        control={control}
        name="description"
        label={t("table.category")}
        fieldType="textarea"
        placeholder="How administrators should use this category"
        fieldClassName="col-span-full"
      />
    </>
  );
}
