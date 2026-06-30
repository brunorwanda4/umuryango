import { useState } from "react";
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
import type { FamilyDetail } from "../../dashboard/types";
import type { ExpenseTransaction } from "./types-and-schemas";

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  family,
  transaction,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  transaction: ExpenseTransaction | null;
  onSuccess: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!transaction) return;
    setIsPending(true);
    setError(null);

    try {
      const response = await apiRequest(
        "delete",
        `/families/${encodeURIComponent(
          family.id,
        )}/money/transactions/${transaction.id}`,
      );

      if (response.ok) {
        toast.success("Expense record reversed successfully.");
        onOpenChange(false);
        onSuccess();
      } else {
        setError(response.message ?? "Expense could not be deleted.");
      }
    } catch {
      setError("Request failed.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            Delete Expense Record
          </DialogTitle>
          <DialogDescription>
            This will reverse the expense and keep an audit record for family
            accountability.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="mb-2 font-medium text-destructive text-sm">
            {error}
          </div>
        ) : null}

        <div className="mb-4 rounded-md bg-muted p-3 text-sm">
          <strong className="block font-semibold">
            {transaction?.description}
          </strong>
          <span className="text-muted-foreground text-xs">
            {transaction?.category.name}
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
