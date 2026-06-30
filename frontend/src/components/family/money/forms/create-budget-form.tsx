"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ListChecksIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import apiRequest from "@/service/api";

const budgetSchema = z.object({
  amountMinorUnits: z.coerce.number().min(1, "Amount must be greater than 0"),
  period: z.enum(["MONTHLY", "YEARLY"]),
  categoryId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

type Category = {
  id: string;
  name: string;
  type: string;
};

export function CreateBudgetForm({ familyId }: { familyId: string }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoadingCategories(true);

    apiRequest<undefined, Category[]>(
      "get",
      `/families/${encodeURIComponent(familyId)}/money/categories`,
    ).then((response) => {
      if (active && response.ok && response.data) {
        setCategories(
          response.data.filter((c) => c.type === "EXPENSE" || c.type === "BOTH"),
        );
      }
      if (active) setLoadingCategories(false);
    });

    return () => {
      active = false;
    };
  }, [open, familyId]);

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    BudgetFormValues,
    unknown
  >({
    schema: budgetSchema,
    formOptions: {
      defaultValues: {
        amountMinorUnits: 0,
        period: "MONTHLY",
        categoryId: "",
        startDate: new Date().toISOString().split("T")[0],
      },
    },
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/budgets`,
    },
    onSuccessMessage: "Budget created successfully",
    toastOnSuccess: true,
    onSuccess: () => {
      setOpen(false);
      form.reset();
      window.location.reload();
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
          <ListChecksIcon aria-hidden="true" data-icon="inline-start" />
          Create budget
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Budget</SheetTitle>
          <SheetDescription>
            Set a spending limit for a specific period and optional category.
          </SheetDescription>
        </SheetHeader>
        <form
          id="budget-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-6"
        >
          {error && <div className="text-sm text-destructive">{error}</div>}

          <CommonFormField
            control={form.control}
            name="amountMinorUnits"
            label="Amount (Minor Units)"
            type="number"
            placeholder="e.g. 50000"
            required
          />

          <CommonFormField
            control={form.control}
            name="period"
            label="Period"
            fieldType="select"
            selectOptions={[
              { label: "Monthly", value: "MONTHLY" },
              { label: "Yearly", value: "YEARLY" },
            ]}
            required
          />

          <CommonFormField
            control={form.control}
            name="startDate"
            label="Start Date"
            fieldType="date"
            required
          />

          <CommonFormField
            control={form.control}
            name="categoryId"
            label="Category (Optional)"
            fieldType="select"
            selectOptions={[
              { label: "Overall (No Category)", value: "" },
              ...categories.map((c) => ({
                label: c.name,
                value: c.id,
              })),
            ]}
            placeholder={
              loadingCategories ? "Loading categories..." : "Select a category"
            }
          />
        </form>
        <SheetFooter>
          <Button
            type="submit"
            form="budget-form"
            disabled={isPending || loadingCategories}
            className="w-full"
          >
            {isPending ? "Creating..." : "Create budget"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
