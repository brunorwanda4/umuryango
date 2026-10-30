"use client";

import { FileUpIcon, PlusIcon, UserPlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { Control } from "react-hook-form";
import { toast } from "sonner";
import { CommonFormField } from "@/components/common/form/common-form-field";
import {
  type ContactFormValues,
  contactFormSchema,
  type FamilyContact,
} from "@/components/family/contacts/types-and-schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import apiRequest from "@/service/api";
import {
  getPersonRelationship,
  type PersonalLoanFormValues,
} from "./types-and-schemas";

type ImportedContact = {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  organization?: string;
  notes?: string;
};

function parseDelimitedLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function firstValue(row: Record<string, string>, names: string[]) {
  const key = names.find((name) => row[name]?.trim());
  return key ? row[key]?.trim() : undefined;
}

function normalizeImportedPhone(value?: string) {
  if (!value) return undefined;
  const candidate = value
    .replace(/^tel:\s*/i, "")
    .split(/\s*(?:,|;|\||\n|\bor\b)\s*/i)[0]
    ?.replace(/\s*(?:ext\.?|extension|x)\s*\d+.*$/i, "")
    .trim();
  if (!candidate) return undefined;
  const normalized = candidate.startsWith("+")
    ? `+${candidate.slice(1).replace(/\D/g, "")}`
    : candidate.replace(/\D/g, "");
  return normalized.length <= 40 ? normalized : undefined;
}

function parseContactFile(text: string, isVcard: boolean): ImportedContact[] {
  if (isVcard) {
    return text
      .split(/BEGIN:VCARD/i)
      .slice(1)
      .map((card): ImportedContact | null => {
        const get = (prefix: string) =>
          card
            .split(/\r?\n/)
            .find((line) => line.toUpperCase().startsWith(prefix))
            ?.split(":")
            .slice(1)
            .join(":")
            .trim()
            .replace(/\\n/g, "\n")
            .replace(/\\,/g, ",");
        const fullName = get("FN") ?? get("N") ?? "";
        const phoneNumber = normalizeImportedPhone(get("TEL"));
        const email = get("EMAIL");
        const organization = get("ORG");
        const notes = get("NOTE");
        return fullName || phoneNumber || email
          ? {
              fullName: fullName || phoneNumber || email || "Imported contact",
              phoneNumber,
              email,
              organization,
              notes,
            }
          : null;
      })
      .filter((contact): contact is ImportedContact => Boolean(contact));
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseDelimitedLine(lines[0] ?? "");
  return lines.slice(1).flatMap((line) => {
    const values = parseDelimitedLine(line);
    const row = Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
    const fullName =
      firstValue(row, ["Name", "First Name", "Given Name"]) ?? "";
    const phoneNumber = normalizeImportedPhone(
      firstValue(row, [
        "Phone 1 - Value",
        "Phone 2 - Value",
        "Phone 3 - Value",
      ]),
    );
    const email = firstValue(row, ["E-mail 1 - Value", "E-mail 2 - Value"]);
    return fullName || phoneNumber || email
      ? [
          {
            fullName: fullName || phoneNumber || email || "Imported contact",
            phoneNumber,
            email,
            address: firstValue(row, ["Address 1 - Formatted", "Address"]),
            organization: firstValue(row, [
              "Organization Name",
              "Organization 1 - Name",
            ]),
            notes: firstValue(row, ["Notes"]),
          },
        ]
      : [];
  });
}

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
        <div className="rounded-md border bg-background p-2">
          <p className="font-semibold">{contacts.length}</p>
          <p className="text-muted-foreground text-xs">Contacts</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="font-semibold">{withPhone}</p>
          <p className="text-muted-foreground text-xs">With phone</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="font-semibold">{withEmail}</p>
          <p className="text-muted-foreground text-xs">With email</p>
        </div>
      </div>
      {contacts.length > 1000 ? (
        <p className="mt-2 text-muted-foreground text-xs">
          Only the first 1,000 contacts will be imported.
        </p>
      ) : null}
    </div>
  );
}

export function AddTrustedPersonDialog({
  familyId,
  onCreated,
  onContactsImported,
  onOpenChange,
  open,
}: {
  familyId: string;
  onCreated: (person: FamilyContact) => void;
  onContactsImported?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [importing, setImporting] = useState(false);
  const [selectedImport, setSelectedImport] = useState<{
    file: File;
    contacts: ImportedContact[];
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ContactFormValues,
    FamilyContact
  >({
    schema: contactFormSchema,
    formOptions: {
      defaultValues: {
        fullName: "",
        contactType: "RELATIVE",
        phoneNumber: "",
        email: "",
        address: "",
        relationshipToFamily: "",
        organization: "",
        notes: "",
        isEmergencyContact: false,
        isLoanContact: true,
        status: "ACTIVE",
      },
    },
    transform: (values) => ({
      ...values,
      phoneNumber: values.phoneNumber || null,
      email: values.email || null,
      address: values.address || null,
      relationshipToFamily: values.relationshipToFamily || null,
      organization: null,
      notes: values.notes || null,
      isLoanContact: true,
      status: "ACTIVE",
    }),
    request: {
      method: "post",
      url: `/families/${encodeURIComponent(familyId)}/contacts`,
    },
    onSuccessMessage: "Person added",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: (person) => {
      if (person) onCreated(person);
      form.reset();
      setSelectedImport(null);
      if (importInputRef.current) importInputRef.current.value = "";
      onOpenChange(false);
    },
  });

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const imported = parseContactFile(
        await file.text(),
        file.name.toLowerCase().endsWith(".vcf"),
      );
      if (!imported.length) {
        toast.error("No contacts were found in that file.");
        return;
      }

      const response = await apiRequest<
        { contacts: ImportedContact[] },
        { created: number; merged: number }
      >("post", `/families/${encodeURIComponent(familyId)}/contacts/import`, {
        contacts: imported.slice(0, 1000),
      });
      if (!response.ok || !response.data) {
        toast.error(response.message ?? "Contacts could not be imported.");
        return;
      }

      toast.success(
        `${response.data.created} added, ${response.data.merged} matched existing contacts.`,
      );
      onContactsImported?.();
      setSelectedImport(null);
      onOpenChange(false);
    } catch {
      toast.error("The contact file could not be read.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      const contacts = parseContactFile(
        await file.text(),
        file.name.toLowerCase().endsWith(".vcf"),
      );
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetMessages();
          setSelectedImport(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add new person</DialogTitle>
          <DialogDescription>
            Save a trusted family member or friend, then continue the loan.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="form" className="gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Add manually</TabsTrigger>
            <TabsTrigger value="file">Upload file</TabsTrigger>
          </TabsList>
          <TabsContent value="form">
            <form
              id="add-trusted-person-form"
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <CommonFormField
                control={form.control}
                name="fullName"
                label="Full name"
                placeholder="e.g. Aline Uwase"
                required
              />
              <CommonFormField
                control={form.control}
                name="contactType"
                label="Relationship"
                fieldType="select"
                selectOptions={[
                  { label: "Family", value: "RELATIVE" },
                  { label: "Friend", value: "FAMILY_FRIEND" },
                  { label: "Neighbor", value: "NEIGHBOR" },
                  { label: "Other trusted person", value: "OTHER" },
                ]}
                required
              />
              <CommonFormField
                control={form.control}
                name="phoneNumber"
                label="Phone number"
                fieldType="phone"
                placeholder="+250 788 000 000"
              />
              <CommonFormField
                control={form.control}
                name="relationshipToFamily"
                label="Relationship details"
                placeholder="e.g. Aunt, cousin, close friend"
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
                  {isPending ? "Adding..." : "Add person"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="file" className="flex flex-col gap-3 min-h-60">
            <p className="text-muted-foreground text-sm">
              Import a Google Contacts CSV or vCard file directly into your
              personal workspace. Existing contacts are matched by phone or
              email.
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
                  <Button
                    type="button"
                    disabled={importing}
                    onClick={() => void handleImport(selectedImport.file)}
                  >
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function PersonSelector({
  contacts,
  control,
  familyId,
  onContactsImported,
  onPersonCreated,
}: {
  contacts: FamilyContact[];
  control: Control<PersonalLoanFormValues>;
  familyId: string;
  onContactsImported: () => void;
  onPersonCreated: (person: FamilyContact) => void;
}) {
  const [openPerson, setOpenPerson] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedImport, setSelectedImport] = useState<{
    file: File;
    contacts: ImportedContact[];
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const imported = parseContactFile(
        await file.text(),
        file.name.toLowerCase().endsWith(".vcf"),
      );
      if (!imported.length) {
        toast.error("No contacts were found in that file.");
        return;
      }

      const response = await apiRequest<
        { contacts: ImportedContact[] },
        { created: number; merged: number }
      >("post", `/families/${encodeURIComponent(familyId)}/contacts/import`, {
        contacts: imported.slice(0, 1000),
      });
      if (!response.ok || !response.data) {
        toast.error(response.message ?? "Contacts could not be imported.");
        return;
      }

      toast.success(
        `${response.data.created} added, ${response.data.merged} matched existing contacts.`,
      );
      onContactsImported();
      setSelectedImport(null);
    } catch {
      toast.error("The contact file could not be read.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      const contacts = parseContactFile(
        await file.text(),
        file.name.toLowerCase().endsWith(".vcf"),
      );
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

  return (
    <>
      <Tabs defaultValue="form" className="gap-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Add manually</TabsTrigger>
          <TabsTrigger value="file">Upload file</TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="flex flex-col gap-4">
          <CommonFormField
            control={control}
            name="personContactId"
            label="Person"
            fieldType="custom"
            required
            render={({ field, id, invalid }) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={String(field.value ?? "")}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id={id}
                    aria-invalid={invalid}
                    className="w-full"
                  >
                    <SelectValue placeholder="Choose a saved person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.fullName} · {getPersonRelationship(contact)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenPerson(true)}
                >
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  Add new person
                </Button>
              </div>
            )}
          />
        </TabsContent>
        <TabsContent value="file" className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Import a Google Contacts CSV or vCard file. Existing contacts are
            matched by phone number or email.
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
                <Button
                  type="button"
                  disabled={importing}
                  onClick={() => void handleImport(selectedImport.file)}
                >
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
        </TabsContent>
      </Tabs>
      <AddTrustedPersonDialog
        familyId={familyId}
        open={openPerson}
        onOpenChange={setOpenPerson}
        onContactsImported={onContactsImported}
        onCreated={(person) => {
          onPersonCreated(person);
          setOpenPerson(false);
        }}
      />
    </>
  );
}
