"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadIcon } from "lucide-react";
import { useState } from "react";
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
import type { MoneyRecordRow } from "../types";

const receiptSchema = z.object({
  transactionId: z.string().min(1, "Transaction is required"),
  // We use string for the file name mockup, in a real app this would be a File object handled by a custom component
  fileName: z.string().optional(),
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

export function CreateReceiptForm({
  familyId,
  transactions,
}: {
  familyId: string;
  transactions: MoneyRecordRow[];
}) {
  const [open, setOpen] = useState(false);

  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ReceiptFormValues,
    unknown
  >({
    schema: receiptSchema,
    formOptions: {
      defaultValues: {
        transactionId: "",
        fileName: "",
      },
    },
    // Mock the file upload by attaching dummy data for the required DTO fields
    transform: (values) => ({
      transactionId: values.transactionId,
      fileName: values.fileName || "receipt.pdf",
      fileType: "application/pdf",
      fileSizeBytes: 1024,
      storageKey: `mock-bunny-storage-key-${Date.now()}`,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/money/receipts`,
    },
    onSuccessMessage: "Receipt uploaded successfully",
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
          <UploadIcon aria-hidden="true" data-icon="inline-start" />
          Upload receipt
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Upload Receipt</SheetTitle>
          <SheetDescription>
            Attach a receipt document to an existing transaction.
          </SheetDescription>
        </SheetHeader>
        <form
          id="receipt-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-6"
        >
          {error && <div className="text-sm text-destructive">{error}</div>}

          <CommonFormField
            control={form.control}
            name="transactionId"
            label="Transaction"
            fieldType="select"
            selectOptions={transactions.map((t) => ({
              label: `${t.date} - ${t.title} (${t.amountMinorUnits})`,
              value: t.id,
            }))}
            placeholder="Select a transaction"
            required
          />

          <CommonFormField
            control={form.control}
            name="fileName"
            label="File (Mock Upload)"
            type="file"
            description="Since the Bunny Storage file upload hook isn't built yet, you can leave this blank or pick a file. We will mock the upload to the backend."
          />
        </form>
        <SheetFooter>
          <Button
            type="submit"
            form="receipt-form"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Uploading..." : "Upload receipt"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
