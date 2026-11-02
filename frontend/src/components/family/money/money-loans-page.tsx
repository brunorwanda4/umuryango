"use client";

import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  calculateLoanSummary,
  EMPTY_SHARED_LOAN_FILTERS,
  filterSharedLoans,
  LoanFilterBar,
  LoanList,
  LoanPageSkeleton,
  LoanSegmentedTabs,
  LoanSummaryVault,
  type SharedLoanFiltersState,
} from "@/components/common/loans";
import { PageTitle } from "@/components/common/pages/page-title";
import type {
  ContactListResponse,
  FamilyContact,
} from "@/components/family/contacts/types-and-schemas";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { AddRepaymentDialog } from "./loans/add-repayment-dialog";
import { AttachLoanDocumentDialog } from "./loans/attach-loan-document-dialog";
import { CreateLoanDialog } from "./loans/create-loan-dialog";
import { EditLoanDialog } from "./loans/edit-loan-dialog";
import { mapFamilyLoanToSharedLoan } from "./loans/family-loans-adapter";
import { LoanDetailsSheet } from "./loans/loan-details-sheet";
import type { LoanAction } from "./loans/loan-table";
import { normalizeLoanRecords } from "./loans/loan-utils";
import type { LoanRecord } from "./loans/types-and-schemas";

export type MoneyLoansPageInitialData = {
  family: FamilyDetail | null;
  loans: LoanRecord[];
  contacts: FamilyContact[];
  error: string | null;
};

export function MoneyLoansPage({
  familyName,
  initialData,
}: {
  familyName: string;
  initialData?: MoneyLoansPageInitialData;
}) {
  const t = createTranslator("FamilyLoans");
  const [family, setFamily] = useState<FamilyDetail | null>(
    initialData?.family ?? null,
  );
  const [loans, setLoans] = useState<LoanRecord[]>(
    initialData?.loans ? normalizeLoanRecords(initialData.loans) : [],
  );
  const [contacts, setContacts] = useState<FamilyContact[]>(
    initialData?.contacts ?? [],
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);
  const [loanMessage, setLoanMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<SharedLoanFiltersState>(
    EMPTY_SHARED_LOAN_FILTERS,
  );
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openRepayment, setOpenRepayment] = useState(false);
  const [openDocument, setOpenDocument] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRecord | null>(null);
  const [detailsLoan, setDetailsLoan] = useState<LoanRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLoanMessage(null);

      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!familyResponse.ok || !familyResponse.data) {
        throw new Error(familyResponse.message ?? "Failed to load family.");
      }

      const familyData = familyResponse.data;
      setFamily(familyData);

      const loansResponse = await apiRequest<undefined, LoanRecord[]>(
        "get",
        `/families/${encodeURIComponent(familyData.id)}/money/loans`,
      );

      if (loansResponse.ok) {
        setLoans(normalizeLoanRecords(loansResponse.data));
      } else {
        setLoans([]);
        setLoanMessage(
          loansResponse.message ??
            "Loan records are not available from the API yet.",
        );
      }

      const contactsResponse = await apiRequest<undefined, ContactListResponse>(
        "get",
        `/families/${encodeURIComponent(
          familyData.id,
        )}/contacts?limit=100&loanOnly=false`,
      );

      if (contactsResponse.ok && contactsResponse.data) {
        setContacts(contactsResponse.data.items);
      } else {
        setContacts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [familyName]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  const currency = family?.defaultCurrency ?? "RWF";
  const canManageLoans = family ? hasCapability(family, "MANAGE_DEBTS") : false;

  const handleAction = useCallback(
    async (loan: LoanRecord, action: LoanAction) => {
      setSelectedLoan(loan);

      if (action === "view" || action === "history") {
        setDetailsLoan(loan);
        return;
      }

      if (action === "edit") {
        setOpenEdit(true);
        return;
      }

      if (action === "repayment") {
        setOpenRepayment(true);
        return;
      }

      if (action === "document") {
        setOpenDocument(true);
        return;
      }

      if (!family || !canManageLoans) {
        toast.error("You do not have permission to manage loans.");
        return;
      }

      if (action === "approval") {
        const response = await apiRequest(
          "post",
          `/families/${encodeURIComponent(
            family.id,
          )}/money/loans/${encodeURIComponent(loan.id)}/submit-approval`,
        );

        if (response.ok) {
          toast.success("Loan sent for approval.");
          fetchData();
        } else {
          toast.error(response.message ?? "Approval request failed.");
        }
        return;
      }

      if (action === "complete") {
        const response = await apiRequest(
          "post",
          `/families/${encodeURIComponent(
            family.id,
          )}/money/loans/${encodeURIComponent(loan.id)}/mark-completed`,
        );

        if (response.ok) {
          toast.success("Loan marked as completed.");
          fetchData();
        } else {
          toast.error(response.message ?? "Could not complete this loan.");
        }
        return;
      }

      if (action === "delete") {
        const response = await apiRequest(
          "delete",
          `/families/${encodeURIComponent(
            family.id,
          )}/money/loans/${encodeURIComponent(loan.id)}`,
        );

        if (response.ok) {
          toast.success("Loan removed according to allowed workflow.");
          fetchData();
        } else {
          toast.error(response.message ?? "This loan cannot be deleted.");
        }
      }
    },
    [family, canManageLoans, fetchData],
  );

  const sharedLoans = useMemo(
    () =>
      loans.map((loan) =>
        mapFamilyLoanToSharedLoan(loan, canManageLoans, handleAction),
      ),
    [loans, canManageLoans, handleAction],
  );

  const filteredSharedLoans = useMemo(
    () => filterSharedLoans(sharedLoans, filters),
    [sharedLoans, filters],
  );

  const summary = useMemo(
    () => calculateLoanSummary(sharedLoans, currency),
    [sharedLoans, currency],
  );

  const counterparties = useMemo(() => {
    const map = new Map<string, string>();
    for (const loan of loans) {
      const name = loan.type === "MONEY_LENT" ? loan.borrower : loan.lender;
      const id =
        (loan.type === "MONEY_LENT"
          ? loan.borrowerContactId
          : loan.lenderContactId) || name;
      if (name && !map.has(id)) {
        map.set(id, name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [loans]);

  const allCount = sharedLoans.length;
  const lentCount = sharedLoans.filter((l) => l.direction === "LENT").length;
  const borrowedCount = sharedLoans.filter(
    (l) => l.direction === "BORROWED",
  ).length;

  if (loading) return <LoanPageSkeleton />;

  if (error || !family) {
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircleIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t((m) => m.FamilyLoans.failedToLoad)}</EmptyTitle>
            <EmptyDescription>
              {error || t((m) => m.FamilyLoans.workspaceNotFound)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button
          variant="outline"
          onClick={() => void fetchData()}
          className="self-center"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 max-w-5xl mx-auto w-full">
      <PageTitle
        title={t((m) => m.FamilyLoans.pageTitle)}
        description={t((m) => m.FamilyLoans.pageDescription)}
        badge={canManageLoans ? "Manager access" : "View access"}
        actions={
          canManageLoans ? (
            <Button
              className="mt-4 w-full sm:w-auto lg:mt-0"
              onClick={() => setOpenCreate(true)}
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              {t((m) => m.FamilyLoans.recordLoan)}
            </Button>
          ) : undefined
        }
      />

      {loanMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved loan records</AlertTitle>
          <AlertDescription>
            This page is ready for loans, repayments, documents, approval state,
            and audit history. Totals stay empty until the backend returns
            persisted family loan records. Detail: {loanMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <LoanSummaryVault
        summary={summary}
        onSelectTab={(dir) => setFilters((f) => ({ ...f, direction: dir }))}
        isPersonal={false}
      />

      <LoanSegmentedTabs
        activeTab={filters.direction}
        onTabChange={(dir) => setFilters((f) => ({ ...f, direction: dir }))}
        allCount={allCount}
        lentCount={lentCount}
        borrowedCount={borrowedCount}
        isPersonal={false}
      />

      <LoanFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        counterparties={counterparties}
      />

      <LoanList
        loans={filteredSharedLoans}
        hasLoans={loans.length > 0}
        onAdd={canManageLoans ? () => setOpenCreate(true) : undefined}
        onResetFilters={() => setFilters(EMPTY_SHARED_LOAN_FILTERS)}
      />

      {/* Reused Existing Workflows & Dialogs */}
      {canManageLoans ? (
        <CreateLoanDialog
          contacts={contacts}
          family={family}
          open={openCreate}
          onOpenChange={setOpenCreate}
          onSuccess={fetchData}
        />
      ) : null}
      <EditLoanDialog
        contacts={contacts}
        family={family}
        loan={selectedLoan}
        open={openEdit}
        onOpenChange={setOpenEdit}
        onSuccess={fetchData}
      />
      <AddRepaymentDialog
        family={family}
        loan={selectedLoan}
        open={openRepayment}
        onOpenChange={setOpenRepayment}
        onSuccess={fetchData}
      />
      <AttachLoanDocumentDialog
        family={family}
        loan={selectedLoan}
        open={openDocument}
        onOpenChange={setOpenDocument}
        onSuccess={fetchData}
      />
      <LoanDetailsSheet
        currency={currency}
        loan={detailsLoan}
        onOpenChange={(open) => {
          if (!open) setDetailsLoan(null);
        }}
      />
      {!canManageLoans && loans.length === 0 ? (
        <Button className="sr-only" onClick={() => setOpenCreate(true)}>
          <PlusIcon aria-hidden="true" />
          Add Loan
        </Button>
      ) : null}
    </div>
  );
}
