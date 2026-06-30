"use client";

import { FolderPlusIcon } from "lucide-react";
import { useState } from "react";
import {
  CategoryFormFields,
  colorOptions,
} from "@/components/family/money/categories/category-form-fields";
import {
  type EditCategoryFormValues,
  editCategorySchema,
  normalizeName,
} from "@/components/family/money/categories/types-and-constants";
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

function getCategorySchema(existingCategories: CategoryNameSource[]) {
  return editCategorySchema.superRefine((values, context) => {
    const duplicate = existingCategories.some(
      (category) =>
        category.type === values.type &&
        normalizeName(category.name) === normalizeName(values.name),
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
    EditCategoryFormValues,
    unknown
  >({
    schema: categorySchema,
    formOptions: {
      defaultValues: {
        name: "",
        description: "",
        type: "EXPENSE",
        icon: "Circle",
        color: colorOptions[0].value,
        status: "ACTIVE",
      },
    },
    transform: (values) => ({
      color: values.color,
      description: values.description,
      icon: values.icon,
      name: values.name,
      status: values.status,
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
      <DialogContent className="sm:max-w-2xl md:max-w-xl overflow-y-auto max-h-[96vh]">
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
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6"
        >
          {error && (
            <div className="text-sm text-destructive col-span-full">
              {error}
            </div>
          )}
          <CategoryFormFields control={form.control} />
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
