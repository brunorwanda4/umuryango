"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import apiRequest from "@/service/api";

const transactionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amountMinorUnits: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

type Category = {
  id: string;
  name: string;
  type: string;
};

export function CreateTransactionForm({
  familyId,
  type,
  actionLabel,
  icon: Icon = PlusIcon,
}: {
  familyId: string;
  type: "INCOME" | "EXPENSE";
  actionLabel: string;
  icon?: React.ElementType;
}) {
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
        // Filter categories based on transaction type (or BOTH)
        setCategories(
          response.data.filter((c) => c.type === type || c.type === "BOTH"),
        );
      }
      if (active) setLoadingCategories(false);
    });

    return () => {
      active = false;
    };
  }, [open, familyId, type]);

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    TransactionFormValues,
    unknown
  >({
    schema: transactionSchema,
    formOptions: {
      defaultValues: {
        title: "",
        amountMinorUnits: 0,
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
        notes: "",
      },
    },
    transform: (values) => ({ ...values, type }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/transactions`,
    },
    onSuccessMessage: `${type === "INCOME" ? "Income" : "Expense"} recorded successfully`,
    toastOnSuccess: true,
    onSuccess: () => {
      setOpen(false);
      form.reset();
      window.location.reload();
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
          <Icon aria-hidden="true" data-icon="inline-start" />
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Record {type === "INCOME" ? "Income" : "Expense"}
          </DialogTitle>
          <DialogDescription>
            Enter the details of the transaction.{" "}
            {type === "EXPENSE" && "It will require approval."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="transaction-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-6"
        >
          {error && <div className="text-sm text-destructive">{error}</div>}

          <CommonFormField
            control={form.control}
            name="title"
            label="Title"
            placeholder="e.g. Rent payment"
            required
          />

          <CommonFormField
            control={form.control}
            name="amountMinorUnits"
            label="Amount (Minor Units)"
            type="number"
            placeholder="e.g. 1000"
            required
            description="Enter the amount in minor units (e.g. cents)"
          />

          <CommonFormField
            control={form.control}
            name="date"
            label="Date"
            fieldType="date"
            required
          />

          <CommonFormField
            control={form.control}
            name="categoryId"
            label="Category"
            fieldType="select"
            selectOptions={categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            placeholder={
              loadingCategories ? "Loading categories..." : "Select a category"
            }
          />

          <CommonFormField
            control={form.control}
            name="notes"
            label="Notes"
            fieldType="textarea"
            placeholder="Optional notes"
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="transaction-form"
            disabled={isPending || loadingCategories}
            className="w-full"
          >
            {isPending ? "Recording..." : `Record ${type.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
