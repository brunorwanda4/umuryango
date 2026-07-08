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
import { Input } from "@/components/ui/input";
import apiRequest from "@/service/api";
import type { FamilyDetail } from "../../dashboard/types";

type ReceiptableTransaction = {
  id: string;
  description: string | null;
};

export function AttachReceiptDialog({
  open,
  onOpenChange,
  family,
  transaction,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilyDetail;
  transaction: ReceiptableTransaction | null;
  onSuccess: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setIsPending(true);
    setError(null);

    const payload = {
      transactionId: transaction.id,
      fileName: fileName || "receipt.pdf",
      fileType: "application/pdf",
      fileSizeBytes: 1024,
      storageKey: `mock-bunny-storage-key-${Date.now()}`,
    };

    try {
      const response = await apiRequest(
        "post",
        `/families/${encodeURIComponent(family.id)}/money/receipts`,
        payload,
      );
      if (response.ok) {
        toast.success("Receipt attached successfully.");
        onOpenChange(false);
        setFileName("");
        onSuccess();
      } else {
        setError(response.message ?? "Failed to save receipt.");
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
          <DialogTitle>Attach Receipt</DialogTitle>
          <DialogDescription>
            Upload proof of transaction for:{" "}
            <strong className="font-semibold">
              {transaction?.description}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          {error && (
            <div className="text-sm text-destructive font-medium">{error}</div>
          )}

          <div>
            <label
              className="text-sm font-semibold mb-1 block"
              htmlFor="receipt-file-input"
            >
              File (Mock Upload)
            </label>
            <Input
              id="receipt-file-input"
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                if (files?.[0]) {
                  setFileName(files[0].name);
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Select any file to attach. Storage upload will be simulated to the
              backend database.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Uploading..." : "Attach Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
