"use client";

import {
  AlertCircleIcon,
  PieChartIcon,
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
  MoneyHeroProgress,
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
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import type { FamilyDetail } from "../dashboard/types";
import type { ProjectsOverview } from "../projects/types";
import { CreateExpenseDialog } from "./expenses/create-expense-dialog";
import { DeleteExpenseDialog } from "./expenses/delete-expense-dialog";
import { EditExpenseDialog } from "./expenses/edit-expense-dialog";
import { ExpenseAnalytics } from "./expenses/expense-analytics";
import { ExpenseDetailsDialog } from "./expenses/expense-details-dialog";
import { ExpenseTable } from "./expenses/expense-table";
import type {
  Category,
  ExpenseFormValues,
  ExpenseLinkOptions,
  ExpenseTransaction,
  ProjectOption,
} from "./expenses/types-and-schemas";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { AttachReceiptDialog } from "./income/attach-receipt-dialog";
import type { MoneyOverview } from "./types";
import { normalizeMoneyOverview, toChartNumber } from "./utils";

export type MoneyExpensesPageInitialData = {
  family: FamilyDetail | null;
  transactions: ExpenseTransaction[];
  categories: Category[];
  money: MoneyOverview | null;
  projects: ProjectOption[];
  error: string | null;
};

const countedExpenseStatuses = new Set<ExpenseTransaction["status"]>([
  "APPROVED",
  "PENDING",
]);

export function MoneyExpensesPage({
  familyName,
  initialData,
}: {
  familyName: string;
  initialData?: MoneyExpensesPageInitialData;
}) {
  const t = createTranslator("FamilyExpenses");
  const [family, setFamily] = useState<FamilyDetail | null>(
    initialData?.family ?? null,
  );
  const [money, setMoney] = useState<MoneyOverview | null>(
    initialData?.money ? normalizeMoneyOverview(initialData.money) : null,
  );
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(
    initialData?.transactions ?? [],
  );
  const [categories, setCategories] = useState<Category[]>(
    initialData?.categories ?? [],
  );
  const [projects, setProjects] = useState<ProjectOption[]>(
    initialData?.projects ?? [],
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);
  const [activeTab, setActiveTab] = useState("data");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTx, setSelectedTx] = useState<ExpenseTransaction | null>(null);
  const [duplicateValues, setDuplicateValues] =
    useState<Partial<ExpenseFormValues> | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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

      const [
        transactionResponse,
        categoriesResponse,
        moneyResponse,
        projectsResponse,
      ] = await Promise.all([
        apiRequest<undefined, ExpenseTransaction[]>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/transactions?type=EXPENSE`,
        ),
        apiRequest<undefined, Category[]>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/categories`,
        ),
        apiRequest<undefined, MoneyOverview>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/overview?period=month`,
        ),
        apiRequest<undefined, ProjectsOverview>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/projects/overview?status=all`,
        ),
      ]);

      if (transactionResponse.ok && transactionResponse.data) {
        setTransactions(transactionResponse.data);
      } else {
        setTransactions([]);
      }

      setCategories(
        categoriesResponse.ok && categoriesResponse.data
          ? categoriesResponse.data.filter(
              (category) => category.type === "EXPENSE",
            )
          : [],
      );
      setMoney(
        moneyResponse.ok ? normalizeMoneyOverview(moneyResponse.data) : null,
      );
      setProjects(
        projectsResponse.ok && projectsResponse.data?.projects
          ? projectsResponse.data.projects.map((project) => ({
              id: project.id,
              name: project.name,
              status: project.status,
            }))
          : [],
      );
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

  const refreshCategories = useCallback(
    async (createdCategory?: Category) => {
      if (!family) {
        await fetchData();
        return;
      }

      if (createdCategory?.type === "EXPENSE") {
        setCategories((currentCategories) =>
          currentCategories.some(
            (category) => category.id === createdCategory.id,
          )
            ? currentCategories
            : [createdCategory, ...currentCategories],
        );
      }

      try {
        const categoriesResponse = await apiRequest<undefined, Category[]>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/categories`,
        );

        if (categoriesResponse.ok) {
          setCategories(
            (categoriesResponse.data ?? []).filter(
              (category) => category.type === "EXPENSE",
            ),
          );
        } else {
          toast.error(
            categoriesResponse.message ??
              t((m) => m.FamilyExpenses.toasts.categoriesRefreshFailed),
          );
        }
      } catch {
        toast.error(t((m) => m.FamilyExpenses.toasts.categoriesRefreshFailed));
      }
    },
    [family, fetchData, t],
  );

  const isAdmin = useMemo(() => {
    if (!family) return false;
    return family.authority === "HEAD" || family.authority === "ADMIN";
  }, [family]);

  const linkOptions = useMemo<ExpenseLinkOptions>(
    () => ({
      budgets: money?.budgets ?? [],
      projects,
    }),
    [money, projects],
  );

  // BigInt-safe summary calculations
  const summary = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let totalExpenses = BigInt(0);
    let monthExpenses = BigInt(0);
    let todayExpenses = BigInt(0);
    let pendingApproval = BigInt(0);

    for (const transaction of transactions) {
      const amount = BigInt(normalizeMinorUnits(transaction.amountMinorUnits));
      const txDate = new Date(transaction.date);
      const isCountedExpense = countedExpenseStatuses.has(transaction.status);
      const isThisMonth =
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;
      const isToday =
        txDate.getDate() === today.getDate() &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear;

      if (isCountedExpense) {
        totalExpenses += amount;

        if (isThisMonth) {
          monthExpenses += amount;
        }

        if (isToday) {
          todayExpenses += amount;
        }
      }

      if (transaction.status === "PENDING") {
        pendingApproval += amount;
      }
    }

    return {
      totalExpenses: totalExpenses.toString(),
      monthExpenses: monthExpenses.toString(),
      todayExpenses: todayExpenses.toString(),
      pendingApproval: pendingApproval.toString(),
    };
  }, [transactions]);

  // Optional real budget progress
  const budgetProgress = useMemo<MoneyHeroProgress | undefined>(() => {
    if (!money?.budgets || money.budgets.length === 0) return undefined;

    let totalBudget = BigInt(0);
    for (const b of money.budgets) {
      totalBudget += BigInt(normalizeMinorUnits(b.limitMinorUnits));
    }

    if (totalBudget <= BigInt(0)) return undefined;

    const percent = safeCalculatePercentage(
      summary.monthExpenses,
      totalBudget.toString(),
    );

    return {
      label: "Monthly Family Budget Used",
      percent,
      percentText: `${percent}% of budget spent`,
    };
  }, [money?.budgets, summary.monthExpenses]);

  // Pending Attention Items
  const pendingTransactions = useMemo(
    () => transactions.filter((t) => t.status === "PENDING"),
    [transactions],
  );

  const handleActionClick = useCallback(
    (
      transaction: ExpenseTransaction,
      action: "view" | "edit" | "delete" | "receipt",
    ) => {
      setSelectedTx(transaction);
      if (action === "view") setOpenView(true);
      if (action === "edit") setOpenEdit(true);
      if (action === "delete") setOpenDelete(true);
      if (action === "receipt") setOpenReceipt(true);
    },
    [],
  );

  const handleSendApproval = useCallback(
    async (transaction: ExpenseTransaction) => {
      if (!family) return;
      if (transaction.status !== "PENDING") {
        toast.success(t((m) => m.FamilyExpenses.toasts.readyForApproval));
        return;
      }

      try {
        const response = await apiRequest(
          "post",
          `/families/${family.id}/money/transactions/${transaction.id}/approve`,
        );
        if (response.ok) {
          toast.success(t((m) => m.FamilyExpenses.toasts.approvedSuccess));
          fetchData();
        } else {
          toast.error(
            response.message ??
              t((m) => m.FamilyExpenses.toasts.approvalFailed),
          );
        }
      } catch {
        toast.error(t((m) => m.FamilyExpenses.toasts.approvalError));
      }
    },
    [family, t, fetchData],
  );

  const pendingAttentionItems = useMemo<MoneyPendingAttentionItem[]>(() => {
    return pendingTransactions.map((tx) => ({
      id: tx.id,
      title: tx.description || tx.category.name || "Expense Record",
      subtitle: tx.receivedBy ? `By: ${tx.receivedBy}` : null,
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

  // Category items with BigInt arithmetic
  const categoryItems = useMemo<MoneyCategoryItem[]>(() => {
    const map = new Map<
      string,
      { id: string; name: string; total: bigint; color?: string | null }
    >();

    for (const tx of transactions) {
      if (tx.status === "REJECTED" || tx.status === "REVERSED") continue;
      const name = tx.category.name || "Uncategorized";
      const id = tx.categoryId || name;
      const amount = BigInt(normalizeMinorUnits(tx.amountMinorUnits));
      if (amount <= BigInt(0)) continue;

      const existing = map.get(id);
      if (existing) {
        existing.total += amount;
      } else {
        map.set(id, {
          id,
          name,
          total: amount,
          color: null,
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
          summary.totalExpenses,
        ),
      }));
  }, [transactions, summary.totalExpenses]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    const min = minAmount ? Number(minAmount.replace(/,/g, "")) : null;
    const max = maxAmount ? Number(maxAmount.replace(/,/g, "")) : null;

    return transactions.filter((transaction) => {
      const searchText = [
        transaction.description,
        transaction.category.name,
        transaction.receivedFrom,
        transaction.receivedBy,
        transaction.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchMatch = !search || searchText.includes(search.toLowerCase());
      const categoryMatch =
        filterCategory === "all" || transaction.categoryId === filterCategory;
      const paymentMatch =
        filterPaymentMethod === "all" ||
        transaction.paymentMethod === filterPaymentMethod;
      const statusMatch =
        filterStatus === "all" || transaction.status === filterStatus;
      const memberMatch =
        filterMember === "all" || transaction.receivedBy === filterMember;

      let dateMatch = true;
      if (startDate) {
        dateMatch =
          dateMatch && new Date(transaction.date) >= new Date(startDate);
      }
      if (endDate) {
        const endLimit = new Date(endDate);
        endLimit.setDate(endLimit.getDate() + 1);
        dateMatch = dateMatch && new Date(transaction.date) < endLimit;
      }

      const amount = toChartNumber(transaction.amountMinorUnits);
      const amountMatch =
        (min === null || Number.isNaN(min) || amount >= min) &&
        (max === null || Number.isNaN(max) || amount <= max);

      return (
        searchMatch &&
        categoryMatch &&
        paymentMatch &&
        statusMatch &&
        memberMatch &&
        dateMatch &&
        amountMatch
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
    minAmount,
    maxAmount,
  ]);

  const handleDuplicate = (transaction: ExpenseTransaction) => {
    setDuplicateValues({
      title: `${transaction.description || "Expense Transaction"} copy`,
      amountMinorUnits: Number(transaction.amountMinorUnits || 0),
      categoryId: transaction.categoryId,
      paidTo: transaction.receivedFrom || "",
      paidBy: transaction.receivedBy || "",
      paymentMethod: transaction.paymentMethod || "CASH",
      notes: transaction.notes || "",
      status: "PENDING",
    });
    setOpenCreate(true);
  };

  const handleDownloadReceipt = (transaction: ExpenseTransaction) => {
    const receipt = transaction.receipts?.[0];
    if (!receipt) {
      toast.error(t((m) => m.FamilyExpenses.toasts.noReceiptAttached));
      return;
    }

    const blob = new Blob(
      [
        `Receipt: ${receipt.fileName}\nExpense: ${
          transaction.description ?? "Expense Transaction"
        }\nDate: ${transaction.date}\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = receipt.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterPaymentMethod("all");
    setFilterStatus("all");
    setFilterMember("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const submetrics = useMemo<MoneyHeroSubmetric[]>(() => {
    return [
      {
        id: "this-month-expenses",
        label: t((m) => m.FamilyExpenses.metrics.expensesThisMonth),
        value: summary.monthExpenses,
        variant: "expense",
        indicatorColor: "rose",
        countText: "Outflows recorded this month",
      },
      {
        id: "today-expenses",
        label: t((m) => m.FamilyExpenses.metrics.expensesToday),
        value: summary.todayExpenses,
        variant: "expense",
        indicatorColor: "amber",
        countText: "Outflows recorded today",
      },
      {
        id: "pending-approval-expenses",
        label: t((m) => m.FamilyExpenses.metrics.pendingApproval),
        value: summary.pendingApproval,
        variant: "pending",
        indicatorColor: "amber",
        countText: `${pendingTransactions.length} awaiting approval`,
      },
      {
        id: "total-expenses-count",
        label: "Total Outflows",
        value: summary.totalExpenses,
        variant: "neutral",
        indicatorColor: "muted",
        countText: `${transactions.length} total records`,
      },
    ];
  }, [t, summary, pendingTransactions.length, transactions.length]);

  const quickActions = useMemo<MoneyActionItem[]>(() => {
    const canRecord = family ? hasCapability(family, "RECORD_EXPENSE") : false;
    return [
      {
        id: "add-expense",
        label: t((m) => m.FamilyExpenses.addExpense),
        description: "Log household payment or cost",
        icon: PlusCircleIcon,
        iconColor: "rose",
        disabled: !canRecord,
        onClick: () => {
          setDuplicateValues(null);
          setOpenCreate(true);
        },
        tooltip: !canRecord
          ? "You do not have permission to record family expenses."
          : undefined,
      },
      {
        id: "view-analytics",
        label: activeTab === "overview" ? "View ledger" : "Budget analytics",
        description: "Analyze budget & project links",
        icon: PieChartIcon,
        iconColor: "purple",
        onClick: () =>
          setActiveTab((prev) => (prev === "overview" ? "data" : "overview")),
      },
      {
        id: "refresh-expenses",
        label: "Refresh",
        description: "Fetch latest expense records",
        icon: RefreshCwIcon,
        iconColor: "zinc",
        onClick: () => {
          void fetchData();
        },
      },
    ];
  }, [family, t, activeTab, fetchData]);

  if (loading) return <FamilyMoneySkeleton />;
  if (error || !family) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="size-5" />
              {t((m) => m.FamilyExpenses.failedToLoad)}
            </CardTitle>
            <CardDescription>
              {error || t((m) => m.FamilyExpenses.workspaceNotFound)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currency = family.defaultCurrency;

  return (
    <MoneyDirectionShell>
      {/* 1. Page Header */}
      <MoneyDirectionHeader
        direction="expense"
        eyebrow="Outflows & Spending"
        periodLabel={family.name}
        title={t((m) => m.FamilyExpenses.pageTitle)}
        description={t((m) => m.FamilyExpenses.pageDescription)}
        actions={
          hasCapability(family, "RECORD_EXPENSE") ? (
            <Button
              size="sm"
              onClick={() => {
                setDuplicateValues(null);
                setOpenCreate(true);
              }}
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              {t((m) => m.FamilyExpenses.addExpense)}
            </Button>
          ) : null
        }
      />

      {/* 2. Top Grid: Directional Hero (7 cols) + Outflow Actions & Pending Attention (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
          <MoneyDirectionalHero
            direction="expense"
            currency={currency}
            totalAmountMinorUnits={summary.totalExpenses}
            eyebrowLabel="TOTAL EXPENSES RECORDED (RWF)"
            periodBadge={
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {currency}
              </span>
            }
            subtitle="Track household bills, groceries, rent, transport, projects, and family operations."
            progress={budgetProgress}
            submetrics={submetrics}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
          <MoneyActionGrid
            title="Expense actions"
            description="Log family expenses, review budget usage, and track approvals."
            actions={quickActions}
          />

          {pendingTransactions.length > 0 ? (
            <MoneyPendingAttentionCard
              direction="expense"
              title="Pending Approvals"
              subtitle="Expense requests awaiting leadership review."
              badgeCount={pendingTransactions.length}
              items={pendingAttentionItems}
            />
          ) : null}
        </div>
      </div>

      {/* 3. Middle Section: Expense Categories Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-12">
          <MoneyCategoryBreakdownCard
            direction="expense"
            title="Expense Categories & Breakdown"
            subtitle="Breakdown of food, housing, utilities, transport, and household costs."
            currency={currency}
            items={categoryItems}
            activeCountLabel={`${categoryItems.length} active categories`}
          />
        </div>
      </div>

      {/* 4. Ledger Section with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="data">
            {t((m) => m.FamilyExpenses.tabData)}
          </TabsTrigger>
          <TabsTrigger value="overview">
            {t((m) => m.FamilyExpenses.tabOverview)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="mt-4 space-y-8">
          <ExpenseTable
            filteredTransactions={filteredTransactions}
            currency={currency}
            isAdmin={isAdmin}
            family={family}
            handleActionClick={handleActionClick}
            handleSendApproval={handleSendApproval}
            handleDuplicate={handleDuplicate}
            handleDownloadReceipt={handleDownloadReceipt}
            setOpenCreate={setOpenCreate}
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
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            resetFilters={resetFilters}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="overview" className="mt-4">
          <ExpenseAnalytics
            transactions={transactions}
            budgets={money?.budgets ?? []}
            currency={currency}
          />
        </TabsContent>
      </Tabs>

      <CreateExpenseDialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) setDuplicateValues(null);
        }}
        family={family}
        categories={categories}
        linkOptions={linkOptions}
        duplicateValues={duplicateValues}
        onCategoriesChanged={refreshCategories}
        onSuccess={fetchData}
      />
      <EditExpenseDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        family={family}
        categories={categories}
        linkOptions={linkOptions}
        transaction={selectedTx}
        onSuccess={fetchData}
      />
      <AttachReceiptDialog
        open={openReceipt}
        onOpenChange={setOpenReceipt}
        family={family}
        transaction={selectedTx}
        onSuccess={fetchData}
      />
      <ExpenseDetailsDialog
        open={openView}
        onOpenChange={setOpenView}
        transaction={selectedTx}
        currency={currency}
      />
      <DeleteExpenseDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        family={family}
        transaction={selectedTx}
        onSuccess={fetchData}
      />
    </MoneyDirectionShell>
  );
}
