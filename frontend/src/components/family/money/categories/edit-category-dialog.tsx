"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import apiRequest from "@/service/api";
import { CategoryFormFields } from "./category-form-fields";
import {
  type EditCategoryFormValues,
  getEditCategorySchema,
  type MoneyCategory,
  todayIso,
} from "./types-and-constants";

export function EditCategoryDialog({
  categories,
  category,
  familyId,
  onOpenChange,
  onUpdated,
  personal = false,
}: {
  categories: MoneyCategory[];
  category: MoneyCategory | null;
  familyId: string;
  onOpenChange: (open: boolean) => void;
  onUpdated: (category: MoneyCategory) => void;
  personal?: boolean;
}) {
  const schema = useMemo(
    () => getEditCategorySchema(categories, category?.id),
    [categories, category?.id],
  );
  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    values: {
      color: category?.color ?? "var(--primary)",
      description: category?.description ?? "",
      icon: category?.icon ?? "Circle",
      name: category?.name ?? "",
      status: category?.status ?? "ACTIVE",
      type: category?.type ?? "EXPENSE",
    },
  });
  const [pending, setPending] = useState(false);

  const handleSubmit = async (values: EditCategoryFormValues) => {
    if (!category) return;

    setPending(true);

    if (category.source === "api") {
      const response = await apiRequest(
        "patch",
        `/families/${encodeURIComponent(familyId)}/money/categories${personal ? "/mine" : ""}/${category.id}`,
        {
          color: values.color,
          description: values.description,
          icon: values.icon,
          name: values.name,
          status: values.status,
          type: values.type,
        },
      );

      if (!response.ok) {
        toast.error(response.message ?? "Category could not be updated");
        setPending(false);
        return;
      }
    }

    onUpdated({
      ...category,
      color: values.color,
      description: values.description ?? "",
      icon: values.icon,
      name: values.name,
      status: values.status,
      type: values.type,
      updatedAt: todayIso(),
    });
    toast.success(`${values.name} updated`);
    setPending(false);
  };

  return (
    <Dialog open={Boolean(category)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update reusable category settings. Names remain unique within each
            type.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6"
          id="edit-category-form"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <CategoryFormFields control={form.control} />
        </form>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={pending}
            form="edit-category-form"
            type="submit"
          >
            {pending ? "Saving..." : "Save category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
