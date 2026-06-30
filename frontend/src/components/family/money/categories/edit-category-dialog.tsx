import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CommonFormField } from "@/components/common/form/common-form-field";
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
import {
  type EditCategoryFormValues,
  type MoneyCategory,
  categoryColors,
  categoryIconMap,
  getEditCategorySchema,
  todayIso,
} from "./types-and-constants";

export function EditCategoryDialog({
  categories,
  category,
  familyId,
  onOpenChange,
  onUpdated,
}: {
  categories: MoneyCategory[];
  category: MoneyCategory | null;
  familyId: string;
  onOpenChange: (open: boolean) => void;
  onUpdated: (category: MoneyCategory) => void;
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
        `/families/${encodeURIComponent(familyId)}/money/categories/${category.id}`,
        {
          description: values.description,
          name: values.name,
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
          className="flex flex-col gap-4 py-6"
          id="edit-category-form"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <CommonFormField
            control={form.control}
            name="name"
            label="Name"
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
            selectOptions={Object.keys(categoryIconMap).map((icon) => ({
              label: icon,
              value: icon,
            }))}
            required
          />
          <CommonFormField
            control={form.control}
            name="color"
            label="Color"
            fieldType="select"
            selectOptions={categoryColors.map((color, index) => ({
              label: `Color ${index + 1}`,
              value: color,
            }))}
            required
          />
          <CommonFormField
            control={form.control}
            name="description"
            label="Description"
            fieldType="textarea"
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
          />
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
