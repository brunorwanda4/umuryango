"use client";

import {
  AlertCircleIcon,
  EyeIcon,
  FileUpIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CommonFormField } from "@/components/common/form/common-form-field";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "../money/family-money-skeleton";
import { formatDate } from "../money/utils";
import {
  type ContactFiltersState,
  type ContactFormValues,
  type ContactListResponse,
  contactFormSchema,
  contactStatusOptions,
  contactTypeLabel,
  contactTypeOptions,
  EMPTY_CONTACT_FILTERS,
  type FamilyContact,
} from "./types-and-schemas";

function getDefaultValues(contact?: FamilyContact | null): ContactFormValues {
  return {
    fullName: contact?.fullName ?? "",
    contactType: contact?.contactType ?? "OTHER",
    phoneNumber: contact?.phoneNumber ?? "",
    email: contact?.email ?? "",
    address: contact?.address ?? "",
    relationshipToFamily: contact?.relationshipToFamily ?? "",
    organization: contact?.organization ?? "",
    notes: contact?.notes ?? "",
    isEmergencyContact: contact?.isEmergencyContact ?? false,
    isLoanContact: contact?.isLoanContact ?? false,
    status: contact?.status ?? "ACTIVE",
  };
}

function normalizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

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

function parseGoogleCsv(text: string): ImportedContact[] {
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
    const phoneNumber = firstValue(row, [
      "Phone 1 - Value",
      "Phone 2 - Value",
      "Phone 3 - Value",
    ]);
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

function parseVcard(text: string): ImportedContact[] {
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
      const phoneNumber = get("TEL");
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

function filterContacts(
  contacts: FamilyContact[],
  filters: ContactFiltersState,
) {
  const search = filters.search.trim().toLowerCase();

  return contacts.filter((contact) => {
    const searchable = [
      contact.fullName,
      contact.phoneNumber,
      contact.email,
      contact.address,
      contact.relationshipToFamily,
      contact.organization,
      contact.notes,
      contact.contactType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!search || searchable.includes(search)) &&
      (filters.contactType === "all" ||
        contact.contactType === filters.contactType) &&
      (filters.status === "all" || contact.status === filters.status) &&
      (!filters.emergencyOnly || contact.isEmergencyContact) &&
      (!filters.loanOnly || contact.isLoanContact)
    );
  });
}

function ContactBadges({ contact }: { contact: FamilyContact }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={contact.status === "ACTIVE" ? "default" : "outline"}>
        {contact.status === "ACTIVE" ? "Active" : "Inactive"}
      </Badge>
      {contact.isEmergencyContact ? (
        <Badge variant="destructive">Emergency</Badge>
      ) : null}
      {contact.isLoanContact ? <Badge variant="secondary">Loan</Badge> : null}
    </div>
  );
}

function ContactActions({ contact }: { contact: FamilyContact }) {
  if (!contact.phoneNumber) return null;
  const whatsAppNumber = normalizePhoneForWhatsApp(contact.phoneNumber);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        href={`tel:${contact.phoneNumber}`}
        size="sm"
        variant="outline"
        className="md:hidden"
      >
        <PhoneIcon aria-hidden="true" data-icon="inline-start" />
        Call
      </Button>
      {whatsAppNumber ? (
        <Button
          href={`https://wa.me/${whatsAppNumber}`}
          size="sm"
          variant="outline"
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircleIcon aria-hidden="true" data-icon="inline-start" />
          WhatsApp
        </Button>
      ) : null}
    </div>
  );
}

function ContactFormDialog({
  contact,
  family,
  mode,
  onOpenChange,
  onSuccess,
  open,
}: {
  contact?: FamilyContact | null;
  family: FamilyDetail;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}) {
  const { form, onSubmit, isPending, error, resetMessages } = useZodFormSubmit<
    ContactFormValues,
    FamilyContact
  >({
    schema: contactFormSchema,
    formOptions: { defaultValues: getDefaultValues(contact) },
    transform: (values) => ({
      ...values,
      phoneNumber: values.phoneNumber || null,
      email: values.email || null,
      address: values.address || null,
      relationshipToFamily: values.relationshipToFamily || null,
      organization: values.organization || null,
      notes: values.notes || null,
    }),
    request: {
      method: mode === "create" ? "post" : "patch",
      url:
        mode === "create"
          ? `/families/${encodeURIComponent(family.id)}/contacts`
          : `/families/${encodeURIComponent(
              family.id,
            )}/contacts/${encodeURIComponent(contact?.id ?? "")}`,
    },
    onSuccessMessage:
      mode === "create" ? "Contact saved successfully" : "Contact updated",
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: () => {
      form.reset(getDefaultValues());
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetMessages();
        if (nextOpen) form.reset(getDefaultValues(contact));
      }}
    >
      {mode === "create" ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Add Contact
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Contact" : "Edit Contact"}
          </DialogTitle>
          <DialogDescription>
            Save trusted people and organizations connected to this family.
          </DialogDescription>
        </DialogHeader>
        <form
          id={`${mode}-contact-form`}
          className="flex flex-col gap-4 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error ? (
            <div className="text-destructive text-sm font-medium">{error}</div>
          ) : null}
          <CommonFormField
            control={form.control}
            name="fullName"
            label="Full name"
            placeholder="e.g. Dr. Aline Uwase"
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="contactType"
              label="Contact type"
              fieldType="select"
              selectOptions={contactTypeOptions}
              required
            />
            <CommonFormField
              control={form.control}
              name="status"
              label="Status"
              fieldType="select"
              selectOptions={contactStatusOptions}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="phoneNumber"
              label="Phone number"
              fieldType="phone"
              placeholder="+250 788 000 000"
            />
            <CommonFormField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="relationshipToFamily"
              label="Relationship to family"
              placeholder="Family doctor, neighbor, aunt, lender"
            />
            <CommonFormField
              control={form.control}
              name="organization"
              label="Organization/company"
              placeholder="Clinic, bank, SACCO, school, business"
            />
          </div>
          <CommonFormField
            control={form.control}
            name="address"
            label="Address"
            placeholder="Street, cell, sector, district, or city"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CommonFormField
              control={form.control}
              name="isEmergencyContact"
              label="Emergency contact"
              fieldType="checkbox"
            />
            <CommonFormField
              control={form.control}
              name="isLoanContact"
              label="Loan contact"
              fieldType="checkbox"
            />
          </div>
          <CommonFormField
            control={form.control}
            name="notes"
            label="Notes"
            fieldType="textarea"
            placeholder="Useful context, availability, lending terms, or emergency notes"
          />
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form={`${mode}-contact-form`}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactDetailsDialog({
  contact,
  onOpenChange,
}: {
  contact: FamilyContact | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(contact)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact?.fullName ?? "Contact details"}</DialogTitle>
          <DialogDescription>
            Trusted contact details saved for this family.
          </DialogDescription>
        </DialogHeader>
        {contact ? (
          <div className="flex flex-col gap-4">
            <ContactBadges contact={contact} />
            <div className="grid gap-3 text-sm">
              <DetailRow
                label="Type"
                value={contactTypeLabel(contact.contactType)}
              />
              <DetailRow label="Phone" value={contact.phoneNumber} />
              <DetailRow label="Email" value={contact.email} />
              <DetailRow
                label="Relationship"
                value={contact.relationshipToFamily}
              />
              <DetailRow label="Organization" value={contact.organization} />
              <DetailRow label="Address" value={contact.address} />
              <DetailRow label="Created by" value={contact.createdByName} />
              <DetailRow
                label="Created date"
                value={formatDate(contact.createdAt)}
              />
            </div>
            {contact.notes ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Notes</div>
                <p className="mt-1 text-muted-foreground">{contact.notes}</p>
              </div>
            ) : null}
            <ContactActions contact={contact} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "Not recorded"}</span>
    </div>
  );
}

export function FamilyContactsPage({
  familyName,
  personal = false,
}: {
  familyName?: string;
  personal?: boolean;
}) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [filters, setFilters] = useState(EMPTY_CONTACT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedContact, setSelectedContact] = useState<FamilyContact | null>(
    null,
  );
  const [detailsContact, setDetailsContact] = useState<FamilyContact | null>(
    null,
  );
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        personal
          ? "/families/personal-workspace"
          : `/families/${encodeURIComponent(familyName ?? "")}`,
      );

      if (!familyResponse.ok || !familyResponse.data) {
        throw new Error(familyResponse.message ?? "Failed to load family.");
      }

      const familyData = familyResponse.data;
      setFamily(familyData);

      const contactsResponse = await apiRequest<undefined, ContactListResponse>(
        "get",
        `/families/${encodeURIComponent(familyData.id)}/contacts?limit=100`,
      );

      if (!contactsResponse.ok || !contactsResponse.data) {
        throw new Error(
          contactsResponse.message ??
            `Failed to load ${personal ? "personal" : "family"} contacts.`,
        );
      }

      setContacts(contactsResponse.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [familyName, personal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setOpenCreate(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || detailsContact) return;
    const contactId = new URLSearchParams(window.location.search).get("view");
    if (!contactId) return;
    const contact = contacts.find((item) => item.id === contactId);
    if (contact) setDetailsContact(contact);
  }, [contacts, detailsContact]);

  const filteredContacts = useMemo(
    () => filterContacts(contacts, filters),
    [contacts, filters],
  );
  const emergencyContacts = useMemo(
    () => contacts.filter((contact) => contact.isEmergencyContact),
    [contacts],
  );
  const handleDelete = async (contact: FamilyContact) => {
    if (!family) return;
    if (
      !window.confirm(
        `Delete ${contact.fullName} from ${personal ? "personal" : "family"} contacts?`,
      )
    ) {
      return;
    }

    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(family.id)}/contacts/${encodeURIComponent(
        contact.id,
      )}`,
    );

    if (response.ok) {
      toast.success("Contact deleted.");
      fetchData();
    } else {
      toast.error(response.message ?? "Could not delete contact.");
    }
  };

  const handleImport = async (file: File) => {
    if (!family) return;
    setImporting(true);
    try {
      const text = await file.text();
      const imported = file.name.toLowerCase().endsWith(".vcf")
        ? parseVcard(text)
        : parseGoogleCsv(text);
      if (!imported.length) {
        toast.error("No contacts were found in that file.");
        return;
      }

      const response = await apiRequest<
        { contacts: ImportedContact[] },
        { created: number; merged: number }
      >("post", `/families/${encodeURIComponent(family.id)}/contacts/import`, {
        contacts: imported.slice(0, 1000),
      });
      if (!response.ok || !response.data) {
        toast.error(response.message ?? "Contacts could not be imported.");
        return;
      }

      toast.success(
        `${response.data.created} added, ${response.data.merged} matched existing contacts.`,
      );
      await fetchData();
    } catch {
      toast.error("The contact file could not be read.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  if (loading) return <FamilyMoneySkeleton />;

  if (error || !family) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Contacts could not load</EmptyTitle>
          <EmptyDescription>
            {error ||
              `${personal ? "Personal" : "Family"} workspace not found.`}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Trusted contacts</Badge>
            <Badge variant="secondary">{contacts.length} saved</Badge>
            {emergencyContacts.length ? (
              <Badge variant="destructive">
                {emergencyContacts.length} emergency
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
              <UsersRoundIcon className="size-5 text-muted-foreground" />
            </span>
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              {personal ? "Personal Contacts" : "Family Contacts"}
            </h1>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Save relatives, neighbors, doctors, lawyers, schools, churches,
            SACCOs, banks, business partners, and loan contacts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            className="hidden"
            accept=".csv,.vcf,text/csv,text/vcard"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={importing}
            onClick={() => importInputRef.current?.click()}
          >
            <FileUpIcon aria-hidden="true" data-icon="inline-start" />
            {importing ? "Importing..." : "Import contacts"}
          </Button>
          <ContactFormDialog
            family={family}
            mode="create"
            open={openCreate}
            onOpenChange={setOpenCreate}
            onSuccess={fetchData}
          />
        </div>
      </header>

      {emergencyContacts.length ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlertIcon className="size-4 text-destructive" />
              Emergency contacts
            </CardTitle>
            <CardDescription>
              Contacts marked for urgent family situations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {emergencyContacts.slice(0, 6).map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{contact.fullName}</div>
                  <div className="text-muted-foreground text-sm">
                    {contact.relationshipToFamily ||
                      contactTypeLabel(contact.contactType)}
                  </div>
                </div>
                <ContactActions contact={contact} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search and filters</CardTitle>
          <CardDescription>
            Find contacts by name, phone, relationship, organization, type, or
            notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_10rem]">
          <div className="relative">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search contacts"
              className="pl-9"
            />
          </div>
          <Select
            value={filters.contactType}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                contactType: value as ContactFiltersState["contactType"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Contact type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {contactTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value as ContactFiltersState["status"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {contactStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-4 lg:col-span-3">
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={filters.emergencyOnly}
                onCheckedChange={(checked) =>
                  setFilters((current) => ({
                    ...current,
                    emergencyOnly: Boolean(checked),
                  }))
                }
              />
              Emergency only
            </Label>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={filters.loanOnly}
                onCheckedChange={(checked) =>
                  setFilters((current) => ({
                    ...current,
                    loanOnly: Boolean(checked),
                  }))
                }
              />
              Loan contacts only
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters(EMPTY_CONTACT_FILTERS)}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Active and inactive trusted contacts connected to {family.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length ? (
            <>
              <div className="grid gap-3 md:hidden">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-3 rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {contact.fullName}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {contact.relationshipToFamily ||
                            contactTypeLabel(contact.contactType)}
                        </div>
                      </div>
                      <ContactBadges contact={contact} />
                    </div>
                    <div className="text-sm">
                      {contact.phoneNumber || contact.email || "No phone/email"}
                    </div>
                    <ContactActions contact={contact} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailsContact(contact)}
                      >
                        <EyeIcon aria-hidden="true" data-icon="inline-start" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedContact(contact);
                          setOpenEdit(true);
                        }}
                      >
                        <PencilIcon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(contact)}
                      >
                        <Trash2Icon
                          aria-hidden="true"
                          data-icon="inline-start"
                        />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.fullName}
                        </TableCell>
                        <TableCell>
                          {contactTypeLabel(contact.contactType)}
                        </TableCell>
                        <TableCell>
                          {contact.phoneNumber || "Not recorded"}
                        </TableCell>
                        <TableCell>
                          {contact.relationshipToFamily || "Not recorded"}
                        </TableCell>
                        <TableCell>
                          {contact.organization || "Not recorded"}
                        </TableCell>
                        <TableCell>
                          <ContactBadges contact={contact} />
                        </TableCell>
                        <TableCell>{formatDate(contact.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Open actions for ${contact.fullName}`}
                              >
                                <MoreVerticalIcon aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailsContact(contact)}
                              >
                                <EyeIcon className="mr-2 size-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setOpenEdit(true);
                                }}
                              >
                                <PencilIcon className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(contact)}
                              >
                                <Trash2Icon className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRoundIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No contacts found</EmptyTitle>
                <EmptyDescription>
                  Add trusted people and organizations the family may need.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" onClick={() => setOpenCreate(true)}>
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  Add Contact
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Separator />

      <ContactFormDialog
        family={family}
        contact={selectedContact}
        mode="edit"
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open);
          if (!open) setSelectedContact(null);
        }}
        onSuccess={fetchData}
      />
      <ContactDetailsDialog
        contact={detailsContact}
        onOpenChange={(open) => {
          if (!open) setDetailsContact(null);
        }}
      />
    </div>
  );
}
