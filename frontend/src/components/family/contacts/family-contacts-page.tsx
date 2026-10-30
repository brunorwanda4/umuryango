"use client";

import { AlertCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "../money/family-money-skeleton";
import { ContactDetailsDialog } from "./contact-details-dialog";
import { ContactFilters } from "./contact-filters";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactList } from "./contact-list";
import { ContactPageHeader } from "./contact-page-header";
import {
  filterContacts,
  type ImportedContact,
  parseGoogleCsv,
  parseVcard,
} from "./contact-utils";
import { EmergencyContactsCard } from "./emergency-contacts-card";
import {
  type ContactListResponse,
  EMPTY_CONTACT_FILTERS,
  type FamilyContact,
} from "./types-and-schemas";

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        personal
          ? "/families/personal-workspace"
          : `/families/${encodeURIComponent(familyName ?? "")}`,
      );

      if (personal && (!familyResponse.ok || !familyResponse.data)) {
        const familiesResponse = await apiRequest<
          undefined,
          Array<Pick<FamilyDetail, "id" | "slug">>
        >("get", "/families?limit=1");
        const fallbackFamily = familiesResponse.data?.[0];
        if (familiesResponse.ok && fallbackFamily) {
          familyResponse = await apiRequest<undefined, FamilyDetail>(
            "get",
            `/families/${encodeURIComponent(fallbackFamily.slug)}`,
          );
        }
      }

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
      `/families/${encodeURIComponent(family.id)}/contacts/${encodeURIComponent(contact.id)}`,
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
      <ContactPageHeader
        personal={personal}
        totalCount={contacts.length}
        emergencyCount={emergencyContacts.length}
        importing={importing}
        onImportFile={handleImport}
        onAddContact={() => setOpenCreate(true)}
      />

      <EmergencyContactsCard emergencyContacts={emergencyContacts} />

      <ContactFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters(EMPTY_CONTACT_FILTERS)}
      />

      <ContactList
        familyName={family.name}
        contacts={filteredContacts}
        onView={setDetailsContact}
        onEdit={(contact) => {
          setSelectedContact(contact);
          setOpenEdit(true);
        }}
        onDelete={handleDelete}
        onAddContact={() => setOpenCreate(true)}
      />

      <Separator />

      <ContactFormDialog
        family={family}
        mode="create"
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={fetchData}
      />

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
