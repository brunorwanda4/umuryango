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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import type { FamilyDetail } from "../../dashboard/types";
import type { IncomeTransaction } from "./types-and-schemas";

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  family,
  transaction,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  transaction: IncomeTransaction | null;
  onSuccess: () => void;
}) {
  const t = createTranslator("FamilyIncome");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!transaction) return;
    setIsPending(true);
    setError(null);

    try {
      const response = await apiRequest(
        "delete",
        `/families/${encodeURIComponent(family.id)}/money/transactions/${transaction.id}`,
      );
      if (response.ok) {
        toast.success(t("reverse.success"));
        onOpenChange(false);
        onSuccess();
      } else {
        setError(response.message ?? t("reverse.failed"));
      }
    } catch {
      setError(t("receipt.requestFailed"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            {t("reverse.title")}
          </DialogTitle>
          <DialogDescription>{t("reverse.desc")}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive font-medium mb-2">
            {error}
          </div>
        )}

        <div className="p-3 bg-muted rounded text-sm mb-4">
          <strong className="font-semibold block">
            {transaction?.description}
          </strong>
          <span className="text-xs text-muted-foreground">
            {transaction?.category.name}
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("reverse.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? t("reverse.reversing") : t("reverse.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
