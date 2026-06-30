"use client";

import { FolderPlusIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";

type CategoryNameSource = {
  id?: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

const iconOptions = [
  "Utensils",
  "Home",
  "Graduation cap",
  "Bus",
  "Fuel",
  "Heart pulse",
  "Wifi",
  "Briefcase",
  "Tractor",
  "Gift",
  "Shield",
  "Circle",
] as const;

const colorOptions = [
  { label: "Slate", value: "var(--muted-foreground)" },
  { label: "Primary", value: "var(--primary)" },
  { label: "Chart 1", value: "var(--chart-1)" },
  { label: "Chart 2", value: "var(--chart-2)" },
  { label: "Chart 3", value: "var(--chart-3)" },
  { label: "Chart 4", value: "var(--chart-4)" },
  { label: "Chart 5", value: "var(--chart-5)" },
] as const;

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getCategorySchema(existingCategories: CategoryNameSource[]) {
  return z
    .object({
      name: z.string().trim().min(1, "Name is required"),
      description: z.string().optional(),
      type: z.enum(["INCOME", "EXPENSE"]),
      icon: z.enum(iconOptions),
      color: z.string().min(1, "Color is required"),
      status: z.enum(["ACTIVE", "INACTIVE"]),
    })
    .superRefine((values, context) => {
      const duplicate = existingCategories.some(
        (category) =>
          category.type === values.type &&
          normalizeCategoryName(category.name) ===
            normalizeCategoryName(values.name),
      );

      if (duplicate) {
        context.addIssue({
          code: "custom",
          message: `An ${values.type.toLowerCase()} category named "${values.name}" already exists.`,
          path: ["name"],
        });
      }
    });
}

type CategoryFormValues = z.infer<ReturnType<typeof getCategorySchema>>;

export function CreateCategoryForm({
  existingCategories = [],
  familyId,
}: {
  existingCategories?: CategoryNameSource[];
  familyId: string;
}) {
  const [open, setOpen] = useState(false);
  const categorySchema = getCategorySchema(existingCategories);

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    CategoryFormValues,
    unknown
  >({
    schema: categorySchema,
    formOptions: {
      defaultValues: {
        name: "",
        description: "",
        type: "EXPENSE",
        icon: "Circle",
        color: "var(--primary)",
        status: "ACTIVE",
      },
    },
    transform: (values) => ({
      description: values.description,
      name: values.name,
      type: values.type,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/categories`,
    },
    onSuccessMessage: "Category created successfully",
    toastOnSuccess: true,
    onSuccess: () => {
      setOpen(false);
      form.reset();
      window.location.reload(); // Quick refresh to update the overview
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetMessages();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <FolderPlusIcon aria-hidden="true" data-icon="inline-start" />
          Create category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Add reusable master data for future income and expense records.
            Category names must be unique within the same type.
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-6"
        >
          {error && <div className="text-sm text-destructive">{error}</div>}

          <CommonFormField
            control={form.control}
            name="name"
            label="Name"
            placeholder="e.g. Food"
            required
          />

          <CommonFormField
            control={form.control}
            name="type"
            label="Type"
            fieldType="select"
            selectOptions={[
              { label: "Expense", value: "EXPENSE" },
              { label: "Income", value: "INCOME" },
            ]}
            required
          />

          <CommonFormField
            control={form.control}
            name="icon"
            label="Icon"
            fieldType="select"
            selectOptions={iconOptions.map((option) => ({
              label: option,
              value: option,
            }))}
            required
          />

          <CommonFormField
            control={form.control}
            name="color"
            label="Color"
            fieldType="select"
            selectOptions={colorOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            required
            description="Used as a visual marker in category lists and future reports."
          />

          <CommonFormField
            control={form.control}
            name="description"
            label="Description"
            fieldType="textarea"
            placeholder="How administrators should use this category"
          />

          <CommonFormField
            control={form.control}
            name="status"
            label="Status"
            fieldType="select"
            selectOptions={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
            required
            description="Inactive categories stay in history but should not be selected for new transactions."
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="category-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Creating..." : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
