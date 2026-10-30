"use client";

import { FolderPlusIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
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
  DialogClose,
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

type CreatedCategory = {
  id: string;
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
  defaultType = "EXPENSE",
  existingCategories = [],
  familyId,
  personal = false,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: {
  defaultType?: "INCOME" | "EXPENSE";
  existingCategories?: CategoryNameSource[];
  familyId: string;
  personal?: boolean;
  onSuccess?: (category: CreatedCategory | undefined) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const categorySchema = getCategorySchema(existingCategories);

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    EditCategoryFormValues,
    CreatedCategory
  >({
    schema: categorySchema,
    formOptions: {
      defaultValues: {
        name: "",
        description: "",
        type: defaultType,
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
      url: `/families/${encodeURIComponent(familyId)}/money/categories${personal ? "/mine" : ""}`,
    },
    onSuccessMessage: "Category created successfully",
    toastOnSuccess: true,
    onSuccess: async (category) => {
      setOpen(false);
      form.reset({
        name: "",
        description: "",
        type: defaultType,
        icon: "Circle",
        color: colorOptions[0].value,
        status: "ACTIVE",
      });
      if (onSuccess) {
        await onSuccess(category);
      } else {
        window.location.reload(); // Keep the existing categories page refresh behavior.
      }
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
      {trigger === null ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <FolderPlusIcon aria-hidden="true" data-icon="inline-start" />
              Create category
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[96vh] overflow-y-auto lg:max-h-[calc(100vh-2rem)] lg:max-w-4xl lg:overflow-y-hidden">
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
          <CategoryFormFields control={form.control} showStatus={false} />
        </form>
        <DialogFooter className=" flex flex-row gap-4  justify-end">
          <DialogClose asChild>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              className=" w-fit"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="category-form"
            disabled={isPending}
            className="w-fit"
          >
            {isPending ? "Creating..." : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
