"use client";

import {
  AlertCircleIcon,
  FileClockIcon,
  LandmarkIcon,
  PlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { AddRepaymentDialog } from "./loans/add-repayment-dialog";
import { AttachLoanDocumentDialog } from "./loans/attach-loan-document-dialog";
import { CreateLoanDialog } from "./loans/create-loan-dialog";
import { EditLoanDialog } from "./loans/edit-loan-dialog";
import { LoanAnalytics } from "./loans/loan-analytics";
import { LoanDetailsSheet } from "./loans/loan-details-sheet";
import { LoanFilters } from "./loans/loan-filters";
import { LoanSummaryCards } from "./loans/loan-summary-cards";
import { type LoanAction, LoanTable } from "./loans/loan-table";
import {
  filterLoans,
  getLoanParties,
  normalizeLoanRecords,
} from "./loans/loan-utils";
import {
  EMPTY_LOAN_FILTERS,
  type LoanFiltersState,
  type LoanRecord,
} from "./loans/types-and-schemas";

export function MoneyLoansPage({ familyName }: { familyName: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loanMessage, setLoanMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoanFiltersState>(EMPTY_LOAN_FILTERS);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [familyName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currency = family?.defaultCurrency ?? "RWF";
  const canManageLoans = family ? hasCapability(family, "MANAGE_DEBTS") : false;
  const filteredLoans = useMemo(
    () => filterLoans(loans, filters),
    [loans, filters],
  );
  const borrowers = useMemo(() => getLoanParties(loans, "borrower"), [loans]);
  const lenders = useMemo(() => getLoanParties(loans, "lender"), [loans]);

  const handleAction = async (loan: LoanRecord, action: LoanAction) => {
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
        )}/money/loans/${encodeURIComponent(loan.id)}/send-for-approval`,
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
        )}/money/loans/${encodeURIComponent(loan.id)}/complete`,
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
  };

  if (loading) return <FamilyMoneySkeleton />;

  if (error || !family) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Loans could not load</EmptyTitle>
          <EmptyDescription>
            {error || "Family workspace not found."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Loan records</Badge>
              <Badge variant="secondary">{currency}</Badge>
              <Badge variant={canManageLoans ? "default" : "outline"}>
                {canManageLoans ? "Manager access" : "View access"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                <LandmarkIcon className="size-5 text-muted-foreground" />
              </span>
              <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
                Loans
              </h1>
            </div>
            <p className="max-w-4xl text-muted-foreground text-sm leading-6">
              Manage family loans, borrowed money, lent money, repayments, due
              dates, and loan records in one secure place.
            </p>
          </div>
          {canManageLoans ? (
            <CreateLoanDialog
              family={family}
              open={openCreate}
              onOpenChange={setOpenCreate}
              onSuccess={fetchData}
            />
          ) : null}
        </div>
        <nav
          aria-label="Loan integrations"
          className="flex gap-2 overflow-x-auto"
        >
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/approvals`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            <FileClockIcon aria-hidden="true" data-icon="inline-start" />
            Approvals
          </Button>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money/receipts`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Receipts
          </Button>
          <Button
            href={`/family/${encodeURIComponent(family.slug)}/money`}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            Money Overview
          </Button>
        </nav>
      </header>

      <Separator />

      {loanMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved loan records</AlertTitle>
          <AlertDescription>
            This page is ready for loans, repayments, documents, approval state,
            and audit history. Totals and charts stay empty until the backend
            returns persisted family loan records. API detail: {loanMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <LoanSummaryCards currency={currency} loans={loans} />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Loan workflow rules</CardTitle>
          <CardDescription>
            Amounts must be greater than zero, borrower and lender are required,
            completed loans are locked, overpayments need admin permission, and
            every sensitive change should be saved to audit history by the
            backend.
          </CardDescription>
        </CardHeader>
      </Card>

      <LoanFilters
        borrowers={borrowers}
        currency={currency}
        filters={filters}
        lenders={lenders}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_LOAN_FILTERS)}
      />

      <LoanAnalytics currency={currency} loans={loans} />

      <LoanTable
        canManageLoans={canManageLoans}
        currency={currency}
        family={family}
        loans={filteredLoans}
        onAction={handleAction}
        onAddLoan={() => setOpenCreate(true)}
      />

      <EditLoanDialog
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
