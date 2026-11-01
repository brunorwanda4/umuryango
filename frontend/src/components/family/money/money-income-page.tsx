"use client";

import {
  AlertCircleIcon,
  LayersIcon,
  PlusCircleIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoneyActionGrid } from "@/components/common/money-section/money-action-grid";
import { MoneyCategoryBreakdownCard } from "@/components/common/money-section/money-category-breakdown-card";
import { MoneyDirectionHeader } from "@/components/common/money-section/money-direction-header";
import { MoneyDirectionShell } from "@/components/common/money-section/money-direction-shell";
import { MoneyDirectionalHero } from "@/components/common/money-section/money-directional-hero";
import { MoneyPendingAttentionCard } from "@/components/common/money-section/money-pending-attention-card";
import {
  normalizeMinorUnits,
  safeCalculatePercentage,
} from "@/components/common/money-section/money-section-utils";
import type {
  MoneyActionItem,
  MoneyCategoryItem,
  MoneyHeroSubmetric,
  MoneyPendingAttentionItem,
} from "@/components/common/money-section/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CurrentUser } from "@/hooks/use-current-user";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import type {
  ContactListResponse,
  FamilyContact,
} from "../contacts/types-and-schemas";
import type { FamilyDetail } from "../dashboard/types";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { AttachReceiptDialog } from "./income/attach-receipt-dialog";
import { CreateIncomeDialog } from "./income/create-income-dialog";
import { DeleteTransactionDialog } from "./income/delete-transaction-dialog";
import { EditIncomeDialog } from "./income/edit-income-dialog";
import { EveryTimeIncomePanel } from "./income/every-time-income-panel";
import { IncomePaymentDialog } from "./income/income-payment-dialog";
import { IncomeTable } from "./income/income-table";
import { OneTimeIncomePanel } from "./income/one-time-income-panel";
import type { Category, IncomeTransaction } from "./income/types-and-schemas";
import { ViewDetailsDialog } from "./income/view-details-dialog";

export type MoneyIncomePageInitialData = {
  family: FamilyDetail | null;
  transactions: IncomeTransaction[];
  categories: Category[];
  contacts: FamilyContact[];
  currentUser: CurrentUser | null;
  error: string | null;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecordDateKey(value: string | null | undefined) {
  if (!value) return null;
  const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateMatch) return dateMatch[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateKey(date);
}

export function MoneyIncomePage({
  familyName,
  initialData,
}: {
  familyName: string;
  initialData?: MoneyIncomePageInitialData;
}) {
  const t = createTranslator("FamilyIncome");
  const tCommon = createTranslator("Common");
  const [family, setFamily] = useState<FamilyDetail | null>(
    initialData?.family ?? null,
  );
  const [transactions, setTransactions] = useState<IncomeTransaction[]>(
    initialData?.transactions ?? [],
  );
  const [categories, setCategories] = useState<Category[]>(
    initialData?.categories ?? [],
  );
  const [contacts, setContacts] = useState<FamilyContact[]>(
    initialData?.contacts ?? [],
  );
  const [loading, setLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);

  // Modals state
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTx, setSelectedTx] = useState<IncomeTransaction | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{
    transaction: IncomeTransaction;
    amountMinorUnits: string;
  } | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(
    async ({ showSkeleton = true }: { showSkeleton?: boolean } = {}) => {
      try {
        if (showSkeleton) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const familyResponse = await apiRequest<undefined, FamilyDetail>(
          "get",
          `/families/${encodeURIComponent(familyName)}`,
        );
        if (!familyResponse.ok || !familyResponse.data) {
          throw new Error(familyResponse.message ?? "Failed to load family.");
        }
        const familyData = familyResponse.data;
        setFamily(familyData);

        const [txResponse, categoriesResponse, contactsResponse] =
          await Promise.all([
            apiRequest<undefined, IncomeTransaction[]>(
              "get",
              `/families/${encodeURIComponent(
                familyData.id,
              )}/money/transactions?type=INCOME`,
            ),
            apiRequest<undefined, Category[]>(
              "get",
              `/families/${encodeURIComponent(familyData.id)}/money/categories`,
            ),
            apiRequest<undefined, ContactListResponse>(
              "get",
              `/families/${encodeURIComponent(
                familyData.id,
              )}/contacts?limit=100&status=ACTIVE`,
            ),
          ]);

        setTransactions(txResponse.ok ? (txResponse.data ?? []) : []);
        setCategories(
          categoriesResponse.ok && categoriesResponse.data
            ? categoriesResponse.data.filter((c) => c.type === "INCOME")
            : [],
        );
        setContacts(
          contactsResponse.ok && contactsResponse.data
            ? (contactsResponse.data.items ?? [])
            : [],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [familyName],
  );

  const refreshTransactions = useCallback(async () => {
    if (!family) {
      await fetchData({ showSkeleton: false });
      return;
    }

    try {
      setIsRefreshing(true);
      const txResponse = await apiRequest<undefined, IncomeTransaction[]>(
        "get",
        `/families/${encodeURIComponent(
          family.id,
        )}/money/transactions?type=INCOME`,
      );

      if (txResponse.ok) {
        setTransactions(txResponse.data ?? []);
      } else {
        toast.error(txResponse.message ?? "Income records could not refresh.");
      }
    } catch {
      toast.error("Income records could not refresh.");
    } finally {
      setIsRefreshing(false);
    }
  }, [family, fetchData]);

  const refreshCategories = useCallback(
    async (createdCategory?: Category) => {
      if (!family) {
        await fetchData({ showSkeleton: false });
        return;
      }

      try {
        setIsRefreshing(true);
        if (createdCategory?.type === "INCOME") {
          setCategories((currentCategories) =>
            currentCategories.some(
              (category) => category.id === createdCategory.id,
            )
              ? currentCategories
              : [createdCategory, ...currentCategories],
          );
        }

        const categoriesResponse = await apiRequest<undefined, Category[]>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/categories`,
        );

        if (categoriesResponse.ok) {
          setCategories(
            (categoriesResponse.data ?? []).filter(
              (category) => category.type === "INCOME",
            ),
          );
        } else {
          toast.error(
            categoriesResponse.message ??
              "Income categories could not refresh.",
          );
        }
      } catch {
        toast.error("Income categories could not refresh.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [family, fetchData],
  );

  const refreshContacts = useCallback(
    async (createdContact?: FamilyContact) => {
      if (!family) {
        await fetchData({ showSkeleton: false });
        return;
      }

      try {
        setIsRefreshing(true);
        if (createdContact) {
          setContacts((currentContacts) =>
            currentContacts.some((contact) => contact.id === createdContact.id)
              ? currentContacts
              : [createdContact, ...currentContacts],
          );
        }

        const contactsResponse = await apiRequest<
          undefined,
          ContactListResponse
        >(
          "get",
          `/families/${encodeURIComponent(
            family.id,
          )}/contacts?limit=100&status=ACTIVE`,
        );

        if (contactsResponse.ok) {
          setContacts(contactsResponse.data?.items ?? []);
        } else {
          toast.error(
            contactsResponse.message ??
              "Income payer contacts could not refresh.",
          );
        }
      } catch {
        toast.error("Income payer contacts could not refresh.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [family, fetchData],
  );

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  const isAdmin = useMemo(() => {
    if (!family) return false;
    return family.authority === "HEAD" || family.authority === "ADMIN";
  }, [family]);

  // Aggregated persisted metrics
  const summary = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const currentMonthKey = todayKey.slice(0, 7);

    let totalRecorded = 0n;
    let monthRecorded = 0n;
    let pendingAmount = 0n;
    let activeRecordCount = 0;

    for (const tx of transactions) {
      if (tx.status === "REJECTED" || tx.status === "REVERSED") {
        continue;
      }

      activeRecordCount += 1;
      const amount = BigInt(normalizeMinorUnits(tx.amountMinorUnits));
      const txDateKey = getRecordDateKey(tx.date);
      totalRecorded += amount;

      if (txDateKey?.startsWith(currentMonthKey)) {
        monthRecorded += amount;
      }

      if (tx.status === "PENDING") {
        pendingAmount += amount;
      }
    }

    const clearedAmount =
      totalRecorded >= pendingAmount ? totalRecorded - pendingAmount : 0n;

    return {
      totalRecorded: totalRecorded.toString(),
      monthRecorded: monthRecorded.toString(),
      pendingAmount: pendingAmount.toString(),
      clearedAmount: clearedAmount.toString(),
      recordCount: activeRecordCount,
    };
  }, [transactions]);

  // Pending Attention Items
  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.status === "PENDING"),
    [transactions],
  );

  // Stream Categories with BigInt safety
  const streamCategoryItems = useMemo<MoneyCategoryItem[]>(() => {
    const map = new Map<
      string,
      { id: string; name: string; total: bigint; color?: string | null }
    >();

    for (const tx of transactions) {
      if (tx.status === "REJECTED" || tx.status === "REVERSED") continue;
      const name = tx.category.name || "Uncategorized";
      const id = tx.categoryId || name;
      const amount = BigInt(normalizeMinorUnits(tx.amountMinorUnits));
      if (amount <= 0n) continue;

      const existing = map.get(id);
      if (existing) {
        existing.total += amount;
      } else {
        map.set(id, {
          id,
          name,
          total: amount,
          color: tx.category.color ?? null,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        amountMinorUnits: entry.total.toString(),
        color: entry.color,
        percentage: safeCalculatePercentage(
          entry.total.toString(),
          summary.totalRecorded,
        ),
      }));
  }, [transactions, summary.totalRecorded]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchMatch =
        !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.receivedFrom?.toLowerCase().includes(search.toLowerCase()) ||
        tx.propertyName?.toLowerCase().includes(search.toLowerCase());

      const categoryMatch =
        filterCategory === "all" || tx.categoryId === filterCategory;

      const paymentMatch =
        filterPaymentMethod === "all" ||
        tx.paymentMethod === filterPaymentMethod;

      const statusMatch = filterStatus === "all" || tx.status === filterStatus;
      const memberMatch =
        filterMember === "all" || tx.receivedBy === filterMember;

      let dateMatch = true;
      if (startDate) {
        dateMatch = dateMatch && new Date(tx.date) >= new Date(startDate);
      }
      if (endDate) {
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

  const everyTimeTransactions = useMemo(
    () =>
      filteredTransactions.filter(
        (transaction) => transaction.incomeRecurrence === "MONTHLY",
      ),
    [filteredTransactions],
  );

  const oneTimeTransactions = useMemo(
    () =>
      filteredTransactions.filter(
        (transaction) => transaction.incomeRecurrence === "ONE_TIME",
      ),
    [filteredTransactions],
  );

  const handleActionClick = useCallback(
    (tx: IncomeTransaction, action: "view" | "edit" | "delete" | "receipt") => {
      setSelectedTx(tx);
      if (action === "view") setOpenView(true);
      else if (action === "edit") setOpenEdit(true);
      else if (action === "delete") setOpenDelete(true);
      else if (action === "receipt") setOpenReceipt(true);
    },
    [],
  );

  const handleSendApproval = useCallback(
    async (tx: IncomeTransaction) => {
      if (!family) return;
      try {
        const res = await apiRequest(
          "post",
          `/families/${family.id}/money/transactions/${tx.id}/approve`,
        );
        if (res.ok) {
          toast.success("Income approved successfully.");
          await refreshTransactions();
        } else {
          toast.error(res.message ?? "Approval failed.");
        }
      } catch {
        toast.error("An error occurred during approval.");
      }
    },
    [family, refreshTransactions],
  );

  const pendingAttentionItems = useMemo<MoneyPendingAttentionItem[]>(() => {
    return pendingTransactions.map((tx) => ({
      id: tx.id,
      title: tx.description || tx.category.name || "Income Record",
      subtitle: tx.receivedFrom ? `From: ${tx.receivedFrom}` : null,
      date: tx.date ? tx.date.slice(0, 10) : null,
      amountMinorUnits: tx.amountMinorUnits,
      currency: family?.defaultCurrency ?? "RWF",
      status: tx.status,
      actionLabel: isAdmin ? "Approve" : undefined,
      onAction: isAdmin ? () => handleSendApproval(tx) : undefined,
      onView: () => handleActionClick(tx, "view"),
    }));
  }, [
    pendingTransactions,
    family?.defaultCurrency,
    isAdmin,
    handleActionClick,
    handleSendApproval,
  ]);

  const openGenericCreate = useCallback((open: boolean) => {
    setOpenCreate(open);
  }, []);

  const handleCreateOpenChange = useCallback((open: boolean) => {
    setOpenCreate(open);
  }, []);

  const handlePaymentOpenChange = useCallback(
    (open: boolean) => {
      if (open && !paymentTarget) {
        toast.error(
          "Choose an every-time income record before recording payment.",
        );
        return;
      }

      if (!open) {
        setPaymentTarget(null);
      }
    },
    [paymentTarget],
  );

  const handleAddPayment = useCallback(
    (tx: IncomeTransaction, amountDueMinorUnits: string) => {
      if (tx.incomeRecurrence !== "MONTHLY") {
        toast.error("Payments can only be recorded for every-time income.");
        return;
      }

      if (!tx.id) {
        toast.error("Income record is missing its transaction ID.");
        return;
      }

      setSelectedTx(tx);
      setOpenCreate(false);
      setOpenEdit(false);
      setOpenView(false);
      setOpenReceipt(false);
      setOpenDelete(false);
      setPaymentTarget({
        transaction: tx,
        amountMinorUnits: amountDueMinorUnits,
      });
    },
    [],
  );

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterPaymentMethod("all");
    setFilterStatus("all");
    setFilterMember("all");
    setStartDate("");
    setEndDate("");
  };

  const submetrics = useMemo<MoneyHeroSubmetric[]>(() => {
    return [
      {
        id: "cleared-income",
        label: "Cleared / Completed",
        value: summary.clearedAmount,
        variant: "income",
        indicatorColor: "emerald",
        countText: `${transactions.filter((t) => t.status === "APPROVED").length} approved payouts`,
      },
      {
        id: "pending-income",
        label: "Pending Inflows",
        value: summary.pendingAmount,
        variant: "pending",
        indicatorColor: "amber",
        countText: `${pendingTransactions.length} awaiting settlement`,
      },
      {
        id: "month-recorded",
        label: "This Month",
        value: summary.monthRecorded,
        variant: "income",
        indicatorColor: "blue",
        countText: "Current month collections",
      },
      {
        id: "total-count",
        label: "Active Records",
        value: summary.recordCount,
        variant: "neutral",
        indicatorColor: "muted",
        countText: `${summary.recordCount} entries recorded`,
      },
    ];
  }, [
    summary.clearedAmount,
    summary.pendingAmount,
    summary.monthRecorded,
    summary.recordCount,
    transactions,
    pendingTransactions.length,
  ]);

  const quickActions = useMemo<MoneyActionItem[]>(() => {
    const canRecord = family ? hasCapability(family, "RECORD_INCOME") : false;
    return [
      {
        id: "add-income",
        label: t((m) => m.FamilyIncome.addIncome),
        description: "Log contribution or deposit",
        icon: PlusCircleIcon,
        iconColor: "emerald",
        disabled: !canRecord,
        onClick: () => openGenericCreate(true),
        tooltip: !canRecord
          ? "You do not have permission to record family income."
          : undefined,
      },
      {
        id: "manage-categories",
        label: "Categories",
        description: "View inflow channels",
        icon: LayersIcon,
        iconColor: "blue",
        onClick: () => {
          const el = document.getElementById("family-income-streams-section");
          el?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        id: "refresh-records",
        label: "Refresh",
        description: "Fetch latest family records",
        icon: RefreshCwIcon,
        iconColor: "zinc",
        onClick: () => {
          void refreshTransactions();
        },
      },
    ];
  }, [family, t, openGenericCreate, refreshTransactions]);

  if (loading) return <FamilyMoneySkeleton />;
  if (error || !family) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircleIcon className="size-5" />
              {t((m) => m.FamilyIncome.failedToLoad)}
            </CardTitle>
            <CardDescription>
              {error || t((m) => m.FamilyIncome.workspaceNotFound)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currency = family.defaultCurrency;

  return (
    <MoneyDirectionShell aria-busy={isRefreshing}>
      {/* 1. Page Header */}
      <MoneyDirectionHeader
        direction="income"
        eyebrow="Inflows & Earnings"
        periodLabel={family.name}
        title={t((m) => m.FamilyIncome.pageTitle)}
        description={t((m) => m.FamilyIncome.pageDescription)}
        actions={
          hasCapability(family, "RECORD_INCOME") ? (
            <Button size="sm" onClick={() => openGenericCreate(true)}>
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              {t((m) => m.FamilyIncome.addIncome)}
            </Button>
          ) : null
        }
      />

      {/* 2. Top Grid: Directional Hero (7 cols) + Inflow Actions & Pending Attention (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
          <MoneyDirectionalHero
            direction="income"
            currency={currency}
            totalAmountMinorUnits={summary.totalRecorded}
            eyebrowLabel="TOTAL INCOME RECORDED (RWF)"
            periodBadge={
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currency}
              </span>
            }
            subtitle="Track member contributions, rent collections, business returns, and grants."
            submetrics={submetrics}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
          <MoneyActionGrid
            title="Inflow actions"
            description="Record family payments, manage income categories, and track approvals."
            actions={quickActions}
          />

          {pendingTransactions.length > 0 ? (
            <MoneyPendingAttentionCard
              direction="income"
              title="Pending & Expected Inflows"
              subtitle="Pledges and transactions awaiting settlement or approval."
              badgeCount={pendingTransactions.length}
              items={pendingAttentionItems}
            />
          ) : null}
        </div>
      </div>

      {/* 3. Middle Section: Streams & Sources Breakdown Card */}
      <div
        id="family-income-streams-section"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-12">
          <MoneyCategoryBreakdownCard
            direction="income"
            title="Income Streams & Sources"
            subtitle="Breakdown of member contributions, rental collections, projects, and communal pots."
            currency={currency}
            items={streamCategoryItems}
            activeCountLabel={`${streamCategoryItems.length} active streams`}
          />
        </div>
      </div>

      {/* 4. Ledger Section with Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="all">{tCommon((m) => m.Common.all)}</TabsTrigger>
          <TabsTrigger value="every-time">
            {t((m) => m.FamilyIncome.tabs.everyTime)}
          </TabsTrigger>
          <TabsTrigger value="one-time">
            {t((m) => m.FamilyIncome.tabs.oneTime)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <IncomeTable
            filteredTransactions={filteredTransactions}
            currency={currency}
            isAdmin={isAdmin}
            family={family}
            handleActionClick={handleActionClick}
            handleSendApproval={handleSendApproval}
            setOpenCreate={openGenericCreate}
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
          />
        </TabsContent>
        <TabsContent value="every-time" className="mt-4">
          <EveryTimeIncomePanel
            transactions={everyTimeTransactions}
            currency={currency}
            isAdmin={isAdmin}
            family={family}
            handleActionClick={handleActionClick}
            onAddPayment={handleAddPayment}
            handleSendApproval={handleSendApproval}
            setOpenCreate={openGenericCreate}
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
          />
        </TabsContent>
        <TabsContent value="one-time" className="mt-4">
          <OneTimeIncomePanel
            transactions={oneTimeTransactions}
            currency={currency}
            isAdmin={isAdmin}
            family={family}
            handleActionClick={handleActionClick}
            handleSendApproval={handleSendApproval}
            setOpenCreate={openGenericCreate}
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
          />
        </TabsContent>
      </Tabs>

      {/* --- ADD INCOME MODAL --- */}
      <CreateIncomeDialog
        open={openCreate}
        onOpenChange={handleCreateOpenChange}
        family={family}
        categories={categories}
        contacts={contacts}
        currentUser={initialData?.currentUser ?? null}
        onCategoriesChanged={refreshCategories}
        onContactsChanged={refreshContacts}
        onSuccess={refreshTransactions}
      />

      {/* --- RECORD RECURRING INCOME PAYMENT MODAL --- */}
      <IncomePaymentDialog
        open={Boolean(paymentTarget)}
        onOpenChange={handlePaymentOpenChange}
        family={family}
        currentUser={initialData?.currentUser ?? null}
        contacts={contacts}
        paymentSource={paymentTarget?.transaction ?? null}
        paymentAmountMinorUnits={paymentTarget?.amountMinorUnits ?? null}
        onContactsChanged={refreshContacts}
        onSuccess={refreshTransactions}
      />

      {/* --- EDIT INCOME MODAL --- */}
      <EditIncomeDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        family={family}
        categories={categories}
        contacts={contacts}
        transaction={selectedTx}
        onCategoriesChanged={refreshCategories}
        onContactsChanged={refreshContacts}
        onSuccess={refreshTransactions}
      />

      {/* --- ATTACH RECEIPT MODAL --- */}
      <AttachReceiptDialog
        open={openReceipt}
        onOpenChange={setOpenReceipt}
        family={family}
        transaction={selectedTx}
        onSuccess={refreshTransactions}
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
        onSuccess={refreshTransactions}
      />
    </MoneyDirectionShell>
  );
}
