"use client";

import { AlertCircleIcon, UserPlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateLoanSummary,
  EMPTY_SHARED_LOAN_FILTERS,
  filterSharedLoans,
  LoanFilterBar,
  LoanHeader,
  LoanList,
  LoanPageSkeleton,
  LoanSegmentedTabs,
  LoanSummaryVault,
  type SharedLoanFiltersState,
} from "@/components/common/loans";
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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { LoanDetailsSheet } from "./loan-details-sheet";
import { LoanForm } from "./loan-form";
import { AddTrustedPersonDialog } from "./person-selector";
import { mapPersonalLoanToSharedLoan } from "./personal-loans-adapter";
import { RecordPaymentForm } from "./record-payment-form";
import {
  isTrustedPerson,
  type LoanCategory,
  normalizePersonalLoans,
  type PersonalLoan,
} from "./types-and-schemas";

export function LoansPage() {
  const t = createTranslator("PersonalLoans");
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [filters, setFilters] = useState<SharedLoanFiltersState>(
    EMPTY_SHARED_LOAN_FILTERS,
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
          t((m) => m.PersonalLoans.page.workspaceNotFound),
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
      setError(
        loansResponse.message ?? t((m) => m.PersonalLoans.page.loadErrorTitle),
      );
    } else {
      setFamily(workspace);
      setContacts((contactsResponse.data?.items ?? []).filter(isTrustedPerson));
      setCategories(categoriesResponse.data ?? []);
      setLoans(normalizePersonalLoans(loansResponse.data));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const sharedLoans = useMemo(
    () =>
      loans.map((loan) =>
        mapPersonalLoanToSharedLoan(loan, setPaymentLoan, setDetailsLoan),
      ),
    [loans],
  );

  const filteredSharedLoans = useMemo(
    () => filterSharedLoans(sharedLoans, filters),
    [sharedLoans, filters],
  );

  const summary = useMemo(
    () => calculateLoanSummary(sharedLoans, family?.defaultCurrency ?? "RWF"),
    [sharedLoans, family?.defaultCurrency],
  );

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

  const allCount = sharedLoans.length;
  const lentCount = sharedLoans.filter((l) => l.direction === "LENT").length;
  const borrowedCount = sharedLoans.filter(
    (l) => l.direction === "BORROWED",
  ).length;

  if (loading) return <LoanPageSkeleton />;

  if (error || !family) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>
            {t((m) => m.PersonalLoans.page.loadErrorTitle)}
          </AlertTitle>
          <AlertDescription>
            {error ?? t((m) => m.PersonalLoans.page.workspaceNotFound)}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => void load()}
          className="self-start"
        >
          {t((m) => m.PersonalLoans.page.tryAgain)}
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
    <div className="flex min-w-0 flex-col gap-5 max-w-5xl mx-auto w-full">
      <LoanHeader
        title={t((m) => m.PersonalLoans.title)}
        subtitle={t((m) => m.PersonalLoans.description)}
        onAdd={() => setOpenLoan(true)}
        addLabel={t((m) => m.PersonalLoans.addLoan)}
      />

      <LoanSummaryVault
        summary={summary}
        onSelectTab={(dir) => setFilters((f) => ({ ...f, direction: dir }))}
        isPersonal
      />

      {contacts.length === 0 ? (
        <Empty className="min-h-64 rounded-2xl border border-dashed border-border bg-card p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlusIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {t((m) => m.PersonalLoans.person.emptyTitle)}
            </EmptyTitle>
            <EmptyDescription>
              {t((m) => m.PersonalLoans.person.emptyDesc)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpenPerson(true)} size="sm">
              <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
              {t((m) => m.PersonalLoans.person.addPerson)}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <LoanSegmentedTabs
            activeTab={filters.direction}
            onTabChange={(dir) => setFilters((f) => ({ ...f, direction: dir }))}
            allCount={allCount}
            lentCount={lentCount}
            borrowedCount={borrowedCount}
            isPersonal
          />

          <LoanFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            counterparties={people}
          />

          <LoanList
            loans={filteredSharedLoans}
            hasLoans={loans.length > 0}
            onAdd={() => setOpenLoan(true)}
            onResetFilters={() => setFilters(EMPTY_SHARED_LOAN_FILTERS)}
          />
        </>
      )}

      {/* Reused Existing Dialogs & Forms */}
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
