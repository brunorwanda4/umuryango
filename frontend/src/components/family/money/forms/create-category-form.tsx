"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, FolderTreeIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { useRouter } from "next/navigation";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CreateCategoryForm({ familyId }: { familyId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
      },
    },
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
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetMessages();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm">
          <FolderTreeIcon aria-hidden="true" data-icon="inline-start" />
          Manage categories
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a Category</SheetTitle>
          <SheetDescription>
            Create a new category to organize your family's transactions.
          </SheetDescription>
        </SheetHeader>
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
            placeholder="e.g. Groceries"
            required
          />

          <CommonFormField
            control={form.control}
            name="description"
            label="Description"
            fieldType="textarea"
            placeholder="Optional description"
          />

          <CommonFormField
            control={form.control}
            name="type"
            label="Type"
            fieldType="select"
            selectOptions={[
              { label: "Expense", value: "EXPENSE" },
              { label: "Income", value: "INCOME" },
              { label: "Both", value: "BOTH" },
            ]}
            required
          />
        </form>
        <SheetFooter>
          <Button
            type="submit"
            form="category-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Creating..." : "Create category"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
