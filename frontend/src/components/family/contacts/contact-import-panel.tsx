"use client";

import { FileUpIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import { importContactsInBatches } from "./contact-import";
import {
  detectContactFileFormat,
  type ImportedContact,
  parseContactFile,
} from "./contact-utils";

const t = createTranslator("FamilyContacts");

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

function ContactFilePreview({
  file,
  contacts,
  format,
}: {
  file: File;
  contacts: ImportedContact[];
  format: "csv" | "vcard";
}) {
  const withPhone = contacts.filter((contact) => contact.phoneNumber).length;
  const withEmail = contacts.filter((contact) => contact.email).length;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="truncate font-medium" title={file.name}>
        {file.name}
      </p>
      <p className="mt-1 text-muted-foreground">
        {formatFileSize(file.size)} ·{" "}
        {format === "vcard" ? "vCard" : "Google CSV"}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          [t((m) => m.FamilyContacts.title), contacts.length],
          [t((m) => m.FamilyContacts.withPhone), withPhone],
          [t((m) => m.FamilyContacts.withEmail), withEmail],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-md border bg-background p-2"
          >
            <p className="font-semibold">{value}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </div>
        ))}
      </div>
      {contacts.length > 1000 ? (
        <p className="mt-2 text-muted-foreground text-xs">
          {t((m) => m.FamilyContacts.largeImportHint)}
        </p>
      ) : null}
    </div>
  );
}

export function ContactImportPanel({
  familyId,
  onImported,
}: {
  familyId: string;
  onImported?: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const [selectedImport, setSelectedImport] = useState<{
    file: File;
    contacts: ImportedContact[];
    format: "csv" | "vcard";
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File) => {
    try {
      const text = await file.text();
      const contacts = parseContactFile(file.name, text);
      if (!contacts.length) {
        setSelectedImport(null);
        toast.error(t((m) => m.FamilyContacts.importEmpty));
        return;
      }
      setSelectedImport({
        file,
        contacts,
        format: detectContactFileFormat(file.name, text),
      });
    } catch {
      setSelectedImport(null);
      toast.error(t((m) => m.FamilyContacts.importFileError));
    }
  };

  const handleImport = async () => {
    if (!selectedImport) return;
    setImporting(true);
    try {
      const result = await importContactsInBatches(
        familyId,
        selectedImport.contacts,
      );
      if (!result.ok) {
        toast.error(
          result.processed > 0
            ? t((m) => m.FamilyContacts.importPartial, {
                processed: result.processed,
                total: selectedImport.contacts.length,
              })
            : (result.message ?? t((m) => m.FamilyContacts.importError)),
        );
        if (result.processed > 0) onImported?.();
        return;
      }
      toast.success(
        t((m) => m.FamilyContacts.importSuccess, {
          created: result.created,
          merged: result.merged,
        }),
      );
      setSelectedImport(null);
      if (importInputRef.current) importInputRef.current.value = "";
      onImported?.();
    } catch {
      toast.error(t((m) => m.FamilyContacts.importUploadError));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex min-h-60 flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {t((m) => m.FamilyContacts.importDescription)}
      </p>
      <input
        ref={importInputRef}
        className="hidden"
        accept=".csv,.vcf,text/csv,text/vcard"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />
      {selectedImport ? (
        <>
          <ContactFilePreview
            file={selectedImport.file}
            contacts={selectedImport.contacts}
            format={selectedImport.format}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={importing} onClick={handleImport}>
              <FileUpIcon aria-hidden="true" data-icon="inline-start" />
              {importing
                ? t((m) => m.FamilyContacts.uploading)
                : t((m) => m.FamilyContacts.uploadContacts)}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              {t((m) => m.FamilyContacts.chooseAnotherFile)}
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={importing}
          onClick={() => importInputRef.current?.click()}
        >
          <FileUpIcon aria-hidden="true" data-icon="inline-start" />
          {t((m) => m.FamilyContacts.chooseContactFile)}
        </Button>
      )}
    </div>
  );
}
