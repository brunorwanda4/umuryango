"use client";

import { AlertCircleIcon } from "lucide-react";
import type * as React from "react";
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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "../money/family-money-skeleton";
import { ContactDetailsDialog } from "./contact-details-dialog";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactList } from "./contact-list";
import { ContactPageHeader } from "./contact-page-header";
import {
  type ImportedContact,
  parseGoogleCsv,
  parseVcard,
} from "./contact-utils";
import { EmergencyContactsCard } from "./emergency-contacts-card";
import {
  type ContactFiltersState,
  type ContactListResponse,
  EMPTY_CONTACT_FILTERS,
  type FamilyContact,
} from "./types-and-schemas";

const t = createTranslator("FamilyContacts");

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
  const [pageIndex, setPageIndex] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

      const params = new URLSearchParams({
        limit: "20",
        page: String(pageIndex + 1),
      });
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.contactType !== "all") {
        params.set("contactType", filters.contactType);
      }
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.emergencyOnly) params.set("emergencyOnly", "true");
      if (filters.loanOnly) params.set("loanOnly", "true");

      const contactsResponse = await apiRequest<undefined, ContactListResponse>(
        "get",
        `/families/${encodeURIComponent(familyData.id)}/contacts?${params.toString()}`,
      );

      if (!contactsResponse.ok || !contactsResponse.data) {
        throw new Error(
          contactsResponse.message ??
            `Failed to load ${personal ? "personal" : "family"} contacts.`,
        );
      }

      setContacts(contactsResponse.data.items);
      setTotalContacts(contactsResponse.data.total);
      setTotalPages(Math.max(contactsResponse.data.totalPages, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [familyName, personal, pageIndex, filters]);

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

  const emergencyContacts = useMemo(
    () => contacts.filter((contact) => contact.isEmergencyContact),
    [contacts],
  );

  const updateFilters = (
    nextFilters: React.SetStateAction<ContactFiltersState>,
  ) => {
    setPageIndex(0);
    setFilters(nextFilters);
  };

  const handleDelete = async (contact: FamilyContact) => {
    if (!family) return;
    const workspaceName = personal
      ? t((m) => m.FamilyContacts.workspacePersonal)
      : t((m) => m.FamilyContacts.workspaceFamily);
    if (
      !window.confirm(
        t((m) => m.FamilyContacts.deleteConfirm, {
          name: contact.fullName,
          workspace: workspaceName,
        }),
      )
    ) {
      return;
    }

    const response = await apiRequest(
      "delete",
      `/families/${encodeURIComponent(family.id)}/contacts/${encodeURIComponent(contact.id)}`,
    );

    if (response.ok) {
      toast.success(t((m) => m.FamilyContacts.deleteSuccess));
      fetchData();
    } else {
      toast.error(response.message ?? t((m) => m.FamilyContacts.deleteError));
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
        toast.error(t((m) => m.FamilyContacts.importEmpty));
        return;
      }

      const response = await apiRequest<
        { contacts: ImportedContact[] },
        { created: number; merged: number }
      >("post", `/families/${encodeURIComponent(family.id)}/contacts/import`, {
        contacts: imported.slice(0, 1000),
      });
      if (!response.ok || !response.data) {
        toast.error(response.message ?? t((m) => m.FamilyContacts.importError));
        return;
      }

      toast.success(
        t((m) => m.FamilyContacts.importSuccess, {
          created: response.data.created,
          merged: response.data.merged,
        }),
      );
      await fetchData();
    } catch {
      toast.error(t((m) => m.FamilyContacts.importFileError));
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
          <EmptyTitle>{t((m) => m.FamilyContacts.loadErrorTitle)}</EmptyTitle>
          <EmptyDescription>
            {error ||
              t((m) => m.FamilyContacts.workspaceNotFound, {
                workspace: personal
                  ? t((m) => m.FamilyContacts.workspacePersonal)
                  : t((m) => m.FamilyContacts.workspaceFamily),
              })}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ContactPageHeader
        personal={personal}
        totalCount={totalContacts}
        emergencyCount={emergencyContacts.length}
        importing={importing}
        onImportFile={handleImport}
        onAddContact={() => setOpenCreate(true)}
      />

      <EmergencyContactsCard emergencyContacts={emergencyContacts} />

      <ContactList
        contacts={contacts}
        onView={setDetailsContact}
        onEdit={(contact) => {
          setSelectedContact(contact);
          setOpenEdit(true);
        }}
        onDelete={handleDelete}
        onAddContact={() => setOpenCreate(true)}
        filters={filters}
        onFiltersChange={updateFilters}
        onResetFilters={() => {
          setPageIndex(0);
          setFilters(EMPTY_CONTACT_FILTERS);
        }}
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPageChange={setPageIndex}
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
        onEdit={(contact) => {
          setDetailsContact(null);
          setSelectedContact(contact);
          setOpenEdit(true);
        }}
        onDelete={(contact) => {
          setDetailsContact(null);
          void handleDelete(contact);
        }}
      />
    </div>
  );
}
