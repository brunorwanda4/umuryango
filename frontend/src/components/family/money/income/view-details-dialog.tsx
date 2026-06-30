import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatMinorUnits } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

export function ViewDetailsDialog({
  open,
  onOpenChange,
  transaction,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: IncomeTransaction | null;
  currency: string;
}) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Income Details</DialogTitle>
          <DialogDescription>
            Full audit view of the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">Title</span>
            <span className="font-semibold text-right">
              {transaction.description || "Income Transaction"}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">Amount</span>
            <span className="font-mono font-semibold text-right text-primary">
              {formatMinorUnits(transaction.amountMinorUnits, currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">Category</span>
            <span className="text-right">{transaction.category.name}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              Date Received
            </span>
            <span className="text-right">{formatDate(transaction.date)}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              Payment Method
            </span>
            <span className="text-right">
              {transaction.paymentMethod?.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              Received From
            </span>
            <span className="text-right">
              {transaction.receivedFrom || "—"}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              Received By
            </span>
            <span className="text-right">{transaction.receivedBy || "—"}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">Status</span>
            <div className="text-right">
              <Badge
                variant={
                  transaction.status === "APPROVED" ? "default" : "secondary"
                }
              >
                {transaction.status}
              </Badge>
            </div>
          </div>

          {transaction.notes && (
            <div className="border-b pb-2">
              <span className="text-muted-foreground font-medium block mb-1">
                Notes
              </span>
              <p className="p-2 bg-muted rounded text-xs leading-5 whitespace-pre-wrap">
                {transaction.notes}
              </p>
            </div>
          )}

          {transaction.receipts && transaction.receipts.length > 0 && (
            <div className="border-b pb-2">
              <span className="text-muted-foreground font-medium block mb-1">
                Receipts ({transaction.receipts.length})
              </span>
              <div className="flex flex-col gap-1.5 mt-1">
                {transaction.receipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 bg-muted/50 border rounded text-xs"
                  >
                    <span className="font-medium truncate max-w-[200px]">
                      {r.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 border-b pb-2 text-xs">
            <span className="text-muted-foreground">Recorded By</span>
            <span className="text-right font-medium">
              {transaction.createdBy.fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2 text-xs">
            <span className="text-muted-foreground">Recorded Date</span>
            <span className="text-right font-medium">
              {formatDate(transaction.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-2 text-xs">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="text-right font-medium">
              {formatDate(transaction.updatedAt)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
