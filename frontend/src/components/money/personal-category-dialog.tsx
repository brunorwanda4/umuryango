"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MoneyCategory } from "@/components/family/money/categories/types-and-constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";

export const CATEGORY_COLORS = [
  "#15803D", // Green
  "#1D4ED8", // Blue
  "#B91C1C", // Red
  "#B45309", // Amber
  "#6D28D9", // Purple
  "#0E7490", // Cyan
  "#BE185D", // Pink
  "#525252", // Gray
];

export function PersonalCategoryDialog({
  open,
  onOpenChange,
  familyId,
  category,
  existingCategories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string | null;
  category?: MoneyCategory | null;
  existingCategories: MoneyCategory[];
  onSuccess: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setType(category.type);
        setColor(category.color || CATEGORY_COLORS[0]);
      } else {
        setName("");
        setType("EXPENSE");
        setColor(CATEGORY_COLORS[0]);
      }
      setError(null);
      setIsPending(false);
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a name. Each category name must be unique.");
      return;
    }

    const isDuplicate = existingCategories.some(
      (c) =>
        c.type === type &&
        c.id !== category?.id &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      setError("Enter a name. Each category name must be unique.");
      return;
    }

    if (!familyId) {
      setError("No family workspace found. Create a workspace first.");
      return;
    }

    setIsPending(true);
    setError(null);

    const isEdit = Boolean(category);
    const method = isEdit ? "patch" : "post";
    const url = isEdit
      ? `/families/${encodeURIComponent(familyId)}/money/categories/mine/${encodeURIComponent(category?.id ?? "")}`
      : `/families/${encodeURIComponent(familyId)}/money/categories/mine`;

    const response = await apiRequest(method, url, {
      name: trimmedName,
      type,
      color,
    });

    if (!response.ok) {
      setError(
        response.message ??
          response.error ??
          "Failed to save category. Please try again.",
      );
      setIsPending(false);
      return;
    }

    toast.success(
      isEdit
        ? "Category updated successfully"
        : "Category created successfully",
    );
    setIsPending(false);
    onOpenChange(false);
    await onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] rounded-[22px] border border-border bg-card p-6 shadow-xl sm:rounded-[22px]"
      >
        <DialogHeader className="p-0">
          <DialogTitle className="font-fraunces text-[22px] font-semibold text-foreground">
            {category ? "Edit category" : "Add category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          {/* Name Field */}
          <div className="mb-3.5 flex flex-col gap-1.5">
            <label
              htmlFor="cat-name-input"
              className="text-[13px] font-medium text-muted-foreground"
            >
              Category name
            </label>
            <input
              id="cat-name-input"
              type="text"
              maxLength={40}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Salary, Food"
              className="h-12 w-full rounded-xl border border-border bg-muted/60 px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* Type Field */}
          <div className="mb-3.5 flex flex-col gap-1.5">
            <label
              htmlFor="cat-type-select"
              className="text-[13px] font-medium text-muted-foreground"
            >
              Type
            </label>
            <select
              id="cat-type-select"
              value={type}
              onChange={(e) => {
                setType(e.target.value as "INCOME" | "EXPENSE");
                if (error) setError(null);
              }}
              className="h-12 w-full rounded-xl border border-border bg-muted/60 px-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          {/* Color Swatch Field */}
          <div className="mb-3.5 flex flex-col gap-2">
            <span className="text-[13px] font-medium text-muted-foreground">
              Color
            </span>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    aria-pressed={isSelected}
                    onClick={() => setColor(c)}
                    style={{
                      backgroundColor: c,
                      boxShadow: isSelected
                        ? "inset 0 0 0 3px hsl(var(--card))"
                        : undefined,
                    }}
                    className={cn(
                      "size-8 cursor-pointer rounded-full border-2 transition-all",
                      isSelected
                        ? "scale-105 border-foreground shadow-sm"
                        : "border-transparent opacity-85 hover:scale-105 hover:opacity-100",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error ? (
            <p className="mb-3 text-sm font-medium text-destructive">{error}</p>
          ) : null}

          {/* Actions */}
          <div className="mt-5 flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 rounded-xl text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 flex-1 rounded-xl bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
