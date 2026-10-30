"use client";

import { FileUpIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import apiRequest from "@/service/api";
import {
  type ImportedContact,
  parseGoogleCsv,
  parseVcard,
} from "./contact-utils";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}

function ContactFilePreview({
  file,
  contacts,
}: {
  file: File;
  contacts: ImportedContact[];
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
        {file.name.toLowerCase().endsWith(".vcf") ? "vCard" : "CSV"} file
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["Contacts", contacts.length],
          ["With phone", withPhone],
          ["With email", withEmail],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border bg-background p-2">
            <p className="font-semibold">{value}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </div>
        ))}
      </div>
      {contacts.length > 1000 ? (
        <p className="mt-2 text-muted-foreground text-xs">
          Only the first 1,000 contacts will be imported.
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
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (file: File) => {
    try {
      const contacts = file.name.toLowerCase().endsWith(".vcf")
        ? parseVcard(await file.text())
        : parseGoogleCsv(await file.text());
      if (!contacts.length) {
        setSelectedImport(null);
        toast.error("No contacts were found in that file.");
        return;
      }
      setSelectedImport({ file, contacts });
    } catch {
      setSelectedImport(null);
      toast.error("The contact file could not be read.");
    }
  };

  const handleImport = async () => {
    if (!selectedImport) return;
    setImporting(true);
    try {
      const response = await apiRequest<
        { contacts: ImportedContact[] },
        { created: number; merged: number }
      >("post", `/families/${encodeURIComponent(familyId)}/contacts/import`, {
        contacts: selectedImport.contacts.slice(0, 1000),
      });
      if (!response.ok || !response.data) {
        toast.error(response.message ?? "Contacts could not be imported.");
        return;
      }
      toast.success(
        `${response.data.created} added, ${response.data.merged} matched existing contacts.`,
      );
      setSelectedImport(null);
      if (importInputRef.current) importInputRef.current.value = "";
      onImported?.();
    } catch {
      toast.error("The contact file could not be uploaded.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex min-h-60 flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Import a Google Contacts CSV or vCard file. Existing contacts are
        matched by phone or email.
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
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={importing} onClick={handleImport}>
              <FileUpIcon aria-hidden="true" data-icon="inline-start" />
              {importing ? "Uploading..." : "Upload contacts"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              Choose another file
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
          Choose contact file
        </Button>
      )}
    </div>
  );
}
