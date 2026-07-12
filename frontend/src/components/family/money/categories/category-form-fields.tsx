"use client";

import type { Control } from "react-hook-form";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

/**
 * Shared field layout for both Create and Edit category dialogs.
 *
 * Render this inside a <form> with:
 *   className="grid grid-cols-1 sm:grid-cols-2 gap-4"
 *
 * Status and Description span full width via col-span-full.
 */
export function CategoryFormFields({ control }: CategoryFormFieldsProps) {
  return (
    <>
      <CommonFormField
        control={control}
        name="name"
        label="Name"
        placeholder="e.g. Food"
        required
      />

      <CommonFormField
        control={control}
        name="type"
        label="Type"
        fieldType="select"
        selectOptions={[
          { label: "Expense", value: "EXPENSE" },
          { label: "Income", value: "INCOME" },
        ]}
        required
      />

      <div className="flex sm:flex-col flex-row gap-4 ">
        <CommonFormField
          control={control}
          name="icon"
          label="Icon"
          fieldType="lucide-icon"
          placeholder="Search icons"
          required
        />

        <CommonFormField
          control={control}
          name="status"
          label="Status"
          fieldType="select"
          selectOptions={[
            { label: "Active", value: "ACTIVE" },
            { label: "Inactive", value: "INACTIVE" },
          ]}
          required
          description="Inactive categories stay in history but should not be selected for new transactions."
          fieldClassName="col-span-full"
        />
      </div>
      <CommonFormField
        control={control}
        name="color"
        label="Color"
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
                      aria-label={`Use ${option.label}`}
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
                    ? "Preset color selected"
                    : isHex
                      ? selectedColor
                      : "Pick a custom color"}
                </span>
              </div>
            </div>
          );
        }}
      />

      <CommonFormField
        control={control}
        name="description"
        label="Description"
        fieldType="textarea"
        placeholder="How administrators should use this category"
        fieldClassName="col-span-full"
      />
    </>
  );
}
