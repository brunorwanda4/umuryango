"use client";

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
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator } from "@/i18n/translate";
import type { FamilyDetail } from "../../dashboard/types";
import {
  type DocumentFormValues,
  documentFormSchema,
  type LoanDocument,
  type LoanRecord,
} from "./types-and-schemas";

export function AttachLoanDocumentDialog({
  family,
  loan,
  onOpenChange,
  onSuccess,
  open,
}: {
  family: FamilyDetail;
  loan: LoanRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const t = createTranslator("FamilyLoans");
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    DocumentFormValues,
    LoanDocument
  >({
    schema: documentFormSchema,
    formOptions: {
      defaultValues: {
        fileName: "",
        notes: "",
      },
    },
    transform: (values) => ({
      fileName: values.fileName || "loan-document.pdf",
      fileType: "application/pdf",
      fileSizeBytes: 1024,
      storageKey: `mock-bunny-loan-document-${Date.now()}`,
      notes: values.notes,
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(
        family.id,
      )}/money/loans/${encodeURIComponent(loan?.id ?? "")}/documents`,
    },
    onSuccessMessage: t((m) => m.FamilyLoans.toasts.documentAttached),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
      onSuccess();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t((m) => m.FamilyLoans.attachDocTitle)}</DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyLoans.attachDocDesc)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="attach-loan-document-form"
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          <CommonFormField
            control={form.control}
            name="fileName"
            label={t((m) => m.FamilyLoans.docFileLabel)}
            type="file"
            description={t((m) => m.FamilyLoans.docFileDesc)}
          />
          <CommonFormField
            control={form.control}
            name="notes"
            label={t((m) => m.FamilyLoans.notesLabel)}
            fieldType="textarea"
            placeholder={t((m) => m.FamilyLoans.notesPlaceholder)}
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="attach-loan-document-form"
            disabled={isPending || !loan}
            className="w-full sm:w-auto"
          >
            {isPending
              ? t((m) => m.FamilyLoans.saving)
              : t((m) => m.FamilyLoans.attachDocBtn)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
