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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyCategories");
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
        toast.error(
          response.message ?? t((m) => m.FamilyCategories.updateFailed),
        );
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
    toast.success(
      t((m) => m.FamilyCategories.updateSuccess, { name: values.name }),
    );
    setPending(false);
  };

  return (
    <Dialog
      open={Boolean(category)}
      onOpenChange={onOpenChange}
      searchParamValue={`edit-category-${category?.id}`}
    >
      <DialogContent className="max-h-[96vh] overflow-y-auto lg:max-h-[calc(100vh-2rem)] lg:max-w-4xl lg:overflow-y-hidden">
        <DialogHeader>
          <DialogTitle>
            {t((m) => m.FamilyCategories.editCategoryDialogTitle)}
          </DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyCategories.editCategoryDialogDesc)}
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
            {pending
              ? t((m) => m.FamilyCategories.savingBtn)
              : t((m) => m.FamilyCategories.saveCategoryBtn)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
