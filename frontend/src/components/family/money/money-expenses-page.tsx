"use client";

import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ExpenseFilters } from "./expenses/expense-filters";
import { ExpenseMetricCards } from "./expenses/expense-metric-cards";
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
          `/families/${encodeURIComponent(
            familyData.id,
          )}/money/transactions?type=EXPENSE`,
        ),
        apiRequest<undefined, Category[]>(
          "get",
          `/families/${encodeURIComponent(familyData.id)}/money/categories`,
        ),
        apiRequest<undefined, MoneyOverview>(
          "get",
          `/families/${encodeURIComponent(
            familyData.id,
          )}/money/overview?period=month`,
        ),
        apiRequest<undefined, ProjectsOverview>(
          "get",
          `/families/${encodeURIComponent(
            familyData.id,
          )}/projects/overview?status=all`,
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
            categoriesResponse.message ?? t("toasts.categoriesRefreshFailed"),
          );
        }
      } catch {
        toast.error(t("toasts.categoriesRefreshFailed"));
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

  const handleActionClick = (
    transaction: ExpenseTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => {
    setSelectedTx(transaction);
    if (action === "view") setOpenView(true);
    if (action === "edit") setOpenEdit(true);
    if (action === "delete") setOpenDelete(true);
    if (action === "receipt") setOpenReceipt(true);
  };

  const handleSendApproval = async (transaction: ExpenseTransaction) => {
    if (!family) return;
    if (transaction.status !== "PENDING") {
      toast.success(t("toasts.readyForApproval"));
      return;
    }

    try {
      const response = await apiRequest(
        "post",
        `/families/${family.id}/money/transactions/${transaction.id}/approve`,
      );
      if (response.ok) {
        toast.success(t("toasts.approvedSuccess"));
        fetchData();
      } else {
        toast.error(response.message ?? t("toasts.approvalFailed"));
      }
    } catch {
      toast.error(t("toasts.approvalError"));
    }
  };

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
      toast.error(t("toasts.noReceiptAttached"));
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

  if (loading) return <FamilyMoneySkeleton />;
  if (error || !family) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="size-5" />
              {t("failedToLoad")}
            </CardTitle>
            <CardDescription>{error || t("workspaceNotFound")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currency = family.defaultCurrency;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={t("pageTitle")}
        description={t("pageDescription")}
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
              {t("addExpense")}
            </Button>
          ) : null
        }
      />
      <Separator />
      <ExpenseMetricCards transactions={transactions} currency={currency} />
      <Tabs>
        <TabsList>
          <TabsTrigger value="data">{t("tabData")}</TabsTrigger>
          <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className=" space-y-8">
          <ExpenseFilters
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
            family={family}
          />
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
          />
        </TabsContent>
        <TabsContent value="overview">
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
    </div>
  );
}
