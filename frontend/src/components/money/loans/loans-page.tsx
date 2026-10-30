"use client";

import { AlertCircleIcon, UserPlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ContactListResponse,
  FamilyContact,
} from "@/components/family/contacts/types-and-schemas";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import apiRequest from "@/service/api";
import { LoanDetailsSheet } from "./loan-details-sheet";
import { LoanFilters } from "./loan-filters";
import { LoanForm } from "./loan-form";
import { LoanPageHeader } from "./loan-page-header";
import { LoanSummary } from "./loan-summary";
import { LoanTabs } from "./loan-tabs";
import { ManagePeopleCard } from "./manage-people-card";
import { AddTrustedPersonDialog } from "./person-selector";
import { RecordPaymentForm } from "./record-payment-form";
import {
  EMPTY_PERSONAL_LOAN_FILTERS,
  isTrustedPerson,
  type LoanCategory,
  normalizePersonalLoans,
  type PersonalLoan,
  type PersonalLoanFilters,
} from "./types-and-schemas";

function LoansSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["borrowed", "lent", "repaid", "remaining"].map((metric) => (
          <Skeleton key={metric} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function LoansPage() {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [filters, setFilters] = useState<PersonalLoanFilters>(
    EMPTY_PERSONAL_LOAN_FILTERS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openLoan, setOpenLoan] = useState(false);
  const [openPerson, setOpenPerson] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<PersonalLoan | null>(null);
  const [detailsLoan, setDetailsLoan] = useState<PersonalLoan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const workspaceResponse = await apiRequest<undefined, FamilyDetail>(
      "get",
      "/families/personal-workspace",
    );
    const workspace = workspaceResponse.data;
    if (!workspaceResponse.ok || !workspace) {
      setError(
        workspaceResponse.message ??
          "Your personal money workspace could not be loaded.",
      );
      setLoading(false);
      return;
    }

    const [contactsResponse, loansResponse, categoriesResponse] =
      await Promise.all([
        apiRequest<undefined, ContactListResponse>(
          "get",
          `/families/${encodeURIComponent(workspace.id)}/contacts?limit=100&status=ACTIVE`,
        ),
        apiRequest<undefined, unknown>(
          "get",
          `/families/${encodeURIComponent(workspace.id)}/money/loans/personal?limit=100`,
        ),
        apiRequest<undefined, LoanCategory[]>(
          "get",
          `/families/${encodeURIComponent(workspace.id)}/money/categories/mine`,
        ),
      ]);

    if (!loansResponse.ok) {
      setError(loansResponse.message ?? "Personal loans could not be loaded.");
    } else {
      setFamily(workspace);
      setContacts((contactsResponse.data?.items ?? []).filter(isTrustedPerson));
      setCategories(categoriesResponse.data ?? []);
      setLoans(normalizePersonalLoans(loansResponse.data));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLoans = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return loans.filter(
      (loan) =>
        (!search ||
          `${loan.title} ${loan.person.name}`.toLowerCase().includes(search)) &&
        (filters.status === "all" || loan.status === filters.status) &&
        (filters.personId === "all" || loan.person.id === filters.personId),
    );
  }, [filters, loans]);
  const people = useMemo(
    () =>
      Array.from(
        new Map(
          loans.map((loan) => [
            loan.person.id,
            { id: loan.person.id, name: loan.person.name },
          ]),
        ).values(),
      ),
    [loans],
  );

  if (loading) return <LoansSkeleton />;

  if (error || !family) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Loans could not load</AlertTitle>
          <AlertDescription>
            {error ?? "Family workspace not found."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  const handlePersonCreated = (person: FamilyContact) =>
    setContacts((current) => [
      ...current.filter((item) => item.id !== person.id),
      person,
    ]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <LoanPageHeader onAdd={() => setOpenLoan(true)} />
      <LoanSummary currency={family.defaultCurrency} loans={loans} />

      {contacts.length === 0 ? (
        <Empty className="min-h-64 rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlusIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Add a person first</EmptyTitle>
            <EmptyDescription>
              Loans must be connected to a family member, friend, or trusted
              person.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpenPerson(true)}>
              <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
              Add person
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <LoanFilters
            filters={filters}
            people={people}
            onChange={setFilters}
          />
          <LoanTabs
            loans={filteredLoans}
            hasLoans={loans.length > 0}
            onAdd={() => setOpenLoan(true)}
            onPayment={(loan) => setPaymentLoan(loan)}
            onView={(loan) => setDetailsLoan(loan)}
          />
        </>
      )}

      <ManagePeopleCard familySlug={family.slug} />
      <LoanForm
        categories={categories}
        contacts={contacts}
        currency={family.defaultCurrency}
        familyId={family.id}
        open={openLoan}
        onContactsImported={() => void load()}
        onOpenChange={setOpenLoan}
        onPersonCreated={handlePersonCreated}
        onSuccess={() => void load()}
      />
      <AddTrustedPersonDialog
        familyId={family.id}
        open={openPerson}
        onOpenChange={setOpenPerson}
        onContactsImported={() => void load()}
        onCreated={handlePersonCreated}
      />
      <RecordPaymentForm
        familyId={family.id}
        loan={paymentLoan}
        open={Boolean(paymentLoan)}
        onOpenChange={(open) => {
          if (!open) setPaymentLoan(null);
        }}
        onSuccess={() => void load()}
      />
      <LoanDetailsSheet
        familyId={family.id}
        familySlug={family.slug}
        loan={detailsLoan}
        onOpenChange={(open) => {
          if (!open) setDetailsLoan(null);
        }}
      />
    </div>
  );
}
