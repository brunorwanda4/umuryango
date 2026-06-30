"use client";

import { AlertCircleIcon, CoinsIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import type { FamilyDetail } from "../dashboard/types";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { AttachReceiptDialog } from "./income/attach-receipt-dialog";
import { CreateIncomeDialog } from "./income/create-income-dialog";
import { DeleteTransactionDialog } from "./income/delete-transaction-dialog";
import { EditIncomeDialog } from "./income/edit-income-dialog";
import { IncomeFilters } from "./income/income-filters";
import { IncomeMetricCards } from "./income/income-metric-cards";
import { IncomeTable } from "./income/income-table";
import type {
  Category,
  IncomeTransaction,
  Receipt,
} from "./income/types-and-schemas";
import { ViewDetailsDialog } from "./income/view-details-dialog";

export function MoneyIncomePage({ familyName }: { familyName: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedTx, setSelectedTx] = useState<IncomeTransaction | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Family Details
      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );
      if (!familyResponse.ok || !familyResponse.data) {
        throw new Error(familyResponse.message ?? "Failed to load family.");
      }
      const familyData = familyResponse.data;
      setFamily(familyData);

      // Load Transactions
      const txResponse = await apiRequest<undefined, IncomeTransaction[]>(
        "get",
        `/families/${encodeURIComponent(familyData.id)}/money/transactions?type=INCOME`,
      );
      if (txResponse.ok && txResponse.data) {
        // Also fetch receipt list for each transaction
        const txsWithReceipts = await Promise.all(
          txResponse.data.map(async (tx) => {
            const receiptResponse = await apiRequest<undefined, Receipt[]>(
              "get",
              `/families/${encodeURIComponent(familyData.id)}/money/receipts/transaction/${tx.id}`,
            );
            return {
              ...tx,
              receipts: receiptResponse.ok ? receiptResponse.data : [],
            };
          }),
        );
        setTransactions(txsWithReceipts);
      } else {
        setTransactions([]);
      }

      // Load Categories
      const categoriesResponse = await apiRequest<undefined, Category[]>(
        "get",
        `/families/${encodeURIComponent(familyData.id)}/money/categories`,
      );
      if (categoriesResponse.ok && categoriesResponse.data) {
        setCategories(
          categoriesResponse.data.filter((c) => c.type === "INCOME"),
        );
      } else {
        setCategories([]);
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

  const isAdmin = useMemo(() => {
    if (!family) return false;
    return family.authority === "HEAD" || family.authority === "ADMIN";
  }, [family]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const searchMatch =
        !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.receivedFrom?.toLowerCase().includes(search.toLowerCase());

      // Category
      const categoryMatch =
        filterCategory === "all" || tx.categoryId === filterCategory;

      // Payment Method
      const paymentMatch =
        filterPaymentMethod === "all" ||
        tx.paymentMethod === filterPaymentMethod;

      // Status
      const statusMatch = filterStatus === "all" || tx.status === filterStatus;

      // Member
      const memberMatch =
        filterMember === "all" || tx.receivedBy === filterMember;

      // Date Range
      let dateMatch = true;
      if (startDate) {
        dateMatch = dateMatch && new Date(tx.date) >= new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to make range inclusive
        const endLimit = new Date(endDate);
        endLimit.setDate(endLimit.getDate() + 1);
        dateMatch = dateMatch && new Date(tx.date) < endLimit;
      }

      return (
        searchMatch &&
        categoryMatch &&
        paymentMatch &&
        statusMatch &&
        memberMatch &&
        dateMatch
      );
    });
  }, [
    transactions,
    search,
    filterCategory,
    filterPaymentMethod,
    filterStatus,
    filterMember,
    startDate,
    endDate,
  ]);

  const handleActionClick = (
    tx: IncomeTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => {
    setSelectedTx(tx);
    if (action === "view") setOpenView(true);
    else if (action === "edit") setOpenEdit(true);
    else if (action === "delete") setOpenDelete(true);
    else if (action === "receipt") setOpenReceipt(true);
  };

  const handleSendApproval = async (tx: IncomeTransaction) => {
    if (!family) return;
    try {
      const res = await apiRequest(
        "post",
        `/families/${family.id}/money/transactions/${tx.id}/approve`,
      );
      if (res.ok) {
        toast.success("Income approved successfully.");
        fetchData();
      } else {
        toast.error(res.message ?? "Approval failed.");
      }
    } catch {
      toast.error("An error occurred during approval.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterPaymentMethod("all");
    setFilterStatus("all");
    setFilterMember("all");
    setStartDate("");
    setEndDate("");
  };

  if (loading) return <FamilyMoneySkeleton />;
  if (error || !family) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircleIcon className="size-5" />
              Failed to load income page
            </CardTitle>
            <CardDescription>
              {error || "Family workspace not found."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currency = family.defaultCurrency;

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Money received</Badge>
            <Badge variant="secondary">{currency}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
              <CoinsIcon className="size-5 text-muted-foreground" />
            </span>
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Income
            </h1>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Manage all money coming into the family, including salary, business
            income, farming income, gifts, donations, rent income, and family
            contributions.
          </p>
        </div>
        {hasCapability(family, "RECORD_INCOME") && (
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Add Income
          </Button>
        )}
      </div>

      <Separator />

      {/* Summary Cards */}
      <IncomeMetricCards transactions={transactions} currency={currency} />

      {/* Filters Bar */}
      <IncomeFilters
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterPaymentMethod={filterPaymentMethod}
        setFilterPaymentMethod={setFilterPaymentMethod}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMember={filterMember}
        setFilterMember={setFilterMember}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        resetFilters={resetFilters}
        categories={categories}
        family={family}
      />

      {/* Main Income Table */}
      <IncomeTable
        filteredTransactions={filteredTransactions}
        currency={currency}
        isAdmin={isAdmin}
        family={family}
        handleActionClick={handleActionClick}
        handleSendApproval={handleSendApproval}
        setOpenCreate={setOpenCreate}
      />

      {/* --- ADD INCOME MODAL --- */}
      <CreateIncomeDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        family={family}
        categories={categories}
        onSuccess={fetchData}
      />

      {/* --- EDIT INCOME MODAL --- */}
      <EditIncomeDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        family={family}
        categories={categories}
        transaction={selectedTx}
        onSuccess={fetchData}
      />

      {/* --- ATTACH RECEIPT MODAL --- */}
      <AttachReceiptDialog
        open={openReceipt}
        onOpenChange={setOpenReceipt}
        family={family}
        transaction={selectedTx}
        onSuccess={fetchData}
      />

      {/* --- VIEW INCOME DETAILS MODAL --- */}
      <ViewDetailsDialog
        open={openView}
        onOpenChange={setOpenView}
        transaction={selectedTx}
        currency={currency}
      />

      {/* --- DELETE/REVERSE TRANSACTION MODAL --- */}
      <DeleteTransactionDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        family={family}
        transaction={selectedTx}
        onSuccess={fetchData}
      />
    </div>
  );
}
