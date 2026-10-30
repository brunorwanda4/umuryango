"use client";

import {
  CoinsIcon,
  LandmarkIcon,
  PlusIcon,
  SearchIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExpenseDashboardResponse } from "@/components/money/expense-dashboard/expense-dashboard-data";
import type { IncomeDashboardResponse } from "@/components/money/income-dashboard/income-dashboard-data";
import {
  normalizePersonalLoans,
  type PersonalLoan,
} from "@/components/money/loans/types-and-schemas";
import {
  type MoneyFormCategory,
  MoneyFormDialog,
} from "@/components/money/money-form-dialog";
import type { FamilySummary } from "@/components/money/types";
import { PersonPlanForm } from "@/components/plans/person-plan-form";
import type {
  PersonalPlansResponse,
  PersonPlan,
} from "@/components/plans/types-and-schemas";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";

export type MoneyTabKey =
  | "all"
  | "income"
  | "expenses"
  | "savings"
  | "debts"
  | "transactions";

export type RealTransaction = {
  id: string;
  type: "in" | "out" | "save";
  title: string;
  source: string;
  category: string;
  date: string;
  rawDate: string;
  status: string;
  amount: number;
};

const TABS: { id: MoneyTabKey; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "savings", label: "Savings" },
  { id: "debts", label: "Debts" },
  { id: "transactions", label: "Transactions" },
];

function formatCompactRwf(
  amountMinorUnits: number | bigint | string,
  currency = "RWF",
) {
  const num =
    typeof amountMinorUnits === "bigint"
      ? Number(amountMinorUnits)
      : Number(amountMinorUnits) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${currency} ${formatted}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${currency} ${Math.round(abs / 1_000)}K`;
  }
  return `${sign}${currency} ${abs.toLocaleString()}`;
}

function formatFullRwf(
  amountMinorUnits: number | bigint | string,
  currency = "RWF",
) {
  const num =
    typeof amountMinorUnits === "bigint"
      ? Number(amountMinorUnits)
      : Number(amountMinorUnits) || 0;
  return `${currency} ${num.toLocaleString()}`;
}

function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "Personal account";
  switch (method) {
    case "MOBILE_MONEY":
      return "Mobile money";
    case "BANK_TRANSFER":
      return "Bank account";
    case "CASH":
      return "Cash";
    case "SAVINGS_WALLET":
      return "Savings wallet";
    default:
      return method.replace(/_/g, " ").toLowerCase();
  }
}

export function PersonalMoneyPage() {
  const [activeTab, setActiveTab] = useState<MoneyTabKey>("all");
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("RWF");
  const [loading, setLoading] = useState(true);

  // Raw fetched data
  const [categories, setCategories] = useState<MoneyFormCategory[]>([]);
  const [incomeDashboard, setIncomeDashboard] =
    useState<IncomeDashboardResponse | null>(null);
  const [expenseDashboard, setExpenseDashboard] =
    useState<ExpenseDashboardResponse | null>(null);
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [plans, setPlans] = useState<PersonPlan[]>([]);

  // Dialog triggers
  const [moneyFormOpen, setMoneyFormOpen] = useState(false);
  const [moneyFormType, setMoneyFormType] = useState<
    "income" | "expense" | "savings" | "debt"
  >("income");
  const [planFormOpen, setPlanFormOpen] = useState(false);

  // Transactions search & chip filter
  const [transactionChip, setTransactionChip] = useState<
    "all" | "in" | "out" | "save"
  >("all");
  const [transactionQuery, setTransactionQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    const familiesResponse = await apiRequest<undefined, FamilySummary[]>(
      "get",
      "/families?limit=1",
    );
    const family = familiesResponse.data?.[0];

    if (!familiesResponse.ok || !family) {
      setFamilyId(null);
      setLoading(false);
      return;
    }

    setFamilyId(family.id);
    setCurrency("RWF");

    const now = new Date();
    const currentYear = now.getFullYear();
    const from = `${currentYear}-01-01`;
    const to = `${currentYear}-12-31`;

    const [categoriesRes, incomeRes, expenseRes, loansRes, plansRes] =
      await Promise.all([
        apiRequest<undefined, MoneyFormCategory[]>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/categories/mine`,
        ),
        apiRequest<undefined, IncomeDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/transactions/mine/dashboard?type=INCOME&from=${from}&to=${to}`,
        ),
        apiRequest<undefined, ExpenseDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/transactions/mine/dashboard?type=EXPENSE&from=${from}&to=${to}`,
        ),
        apiRequest<undefined, unknown>(
          "get",
          `/families/${encodeURIComponent(family.id)}/money/loans/personal?limit=100`,
        ),
        apiRequest<undefined, PersonalPlansResponse>("get", "/personal-plans"),
      ]);

    if (categoriesRes.ok && categoriesRes.data) {
      setCategories(categoriesRes.data);
    }
    if (incomeRes.ok && incomeRes.data) {
      setIncomeDashboard(incomeRes.data);
    }
    if (expenseRes.ok && expenseRes.data) {
      setExpenseDashboard(expenseRes.data);
    }
    if (loansRes.ok && loansRes.data) {
      setLoans(normalizePersonalLoans(loansRes.data));
    }
    if (plansRes.ok && plansRes.data) {
      setPlans(plansRes.data.plans ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Combine and normalize transactions
  const allTransactions: RealTransaction[] = useMemo(() => {
    const list: RealTransaction[] = [];

    const incomeRecords = incomeDashboard?.records ?? [];
    for (const r of incomeRecords) {
      list.push({
        id: r.id,
        type: "in",
        title: r.description || r.category?.name || "Income",
        source: paymentMethodLabel(r.paymentMethod),
        category: r.category?.name || "Income",
        date: formatDisplayDate(r.date),
        rawDate: r.date,
        status:
          r.status === "APPROVED"
            ? "Received"
            : r.status === "PENDING"
              ? "Pending"
              : r.status,
        amount: Number(r.amountMinorUnits) || 0,
      });
    }

    const expenseRecords = expenseDashboard?.records ?? [];
    for (const r of expenseRecords) {
      list.push({
        id: r.id,
        type: "out",
        title: r.description || r.category?.name || "Expense",
        source: paymentMethodLabel(r.paymentMethod),
        category: r.category?.name || "Expense",
        date: formatDisplayDate(r.date),
        rawDate: r.date,
        status:
          r.status === "APPROVED"
            ? "Paid"
            : r.status === "PENDING"
              ? "Pending"
              : r.status,
        amount: Number(r.amountMinorUnits) || 0,
      });
    }

    // Sort descending by date
    list.sort((a, b) => {
      const da = new Date(a.rawDate).getTime();
      const db = new Date(b.rawDate).getTime();
      return db - da;
    });

    return list;
  }, [incomeDashboard, expenseDashboard]);

  // Financial totals
  const totalIncome = useMemo(() => {
    if (incomeDashboard?.summary?.periodTotalMinorUnits) {
      return Number(incomeDashboard.summary.periodTotalMinorUnits);
    }
    return allTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [incomeDashboard, allTransactions]);

  const totalExpenses = useMemo(() => {
    if (expenseDashboard?.summary?.periodTotalMinorUnits) {
      return Number(expenseDashboard.summary.periodTotalMinorUnits);
    }
    return allTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [expenseDashboard, allTransactions]);

  const balance = totalIncome - totalExpenses;

  // Savings totals from plans
  const savingsPlans = useMemo(() => {
    return plans.filter(
      (p) =>
        p.needsMoney ||
        p.type === "LONG_TERM_GOAL" ||
        Number(p.targetAmountMinorUnits || 0) > 0,
    );
  }, [plans]);

  const totalSavings = useMemo(() => {
    return savingsPlans.reduce(
      (sum, p) => sum + Number(p.currentAmountMinorUnits || 0),
      0,
    );
  }, [savingsPlans]);

  // Primary active savings goal
  const nextSavingsGoal = useMemo(() => {
    if (savingsPlans.length === 0) return null;
    return savingsPlans[0];
  }, [savingsPlans]);

  // Debts from loans
  const borrowedLoans = useMemo(() => {
    return loans.filter((l) => l.type === "BORROWED");
  }, [loans]);

  const totalDebt = useMemo(() => {
    return borrowedLoans.reduce(
      (sum, l) => sum + Number(l.remainingBalanceMinorUnits || 0),
      0,
    );
  }, [borrowedLoans]);

  const totalBorrowedOriginal = useMemo(() => {
    return borrowedLoans.reduce(
      (sum, l) => sum + Number(l.originalAmountMinorUnits || 0),
      0,
    );
  }, [borrowedLoans]);

  const activeDebt = useMemo(() => {
    return borrowedLoans.find((l) => l.status === "ACTIVE") || borrowedLoans[0];
  }, [borrowedLoans]);

  // Category aggregations for bars
  const incomeCategoryBars = useMemo(() => {
    const incomeItems = allTransactions.filter((x) => x.type === "in");
    const m: Record<string, number> = {};
    for (const x of incomeItems) {
      const cat = x.category || "Other";
      m[cat] = (m[cat] || 0) + x.amount;
    }
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    const max = Math.max(1, ...Object.values(m));
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        pct: Math.round((amount / total) * 100),
        barWidth: Math.round((amount / max) * 100),
      }));
  }, [allTransactions]);

  const expenseCategoryBars = useMemo(() => {
    const expenseItems = allTransactions.filter((x) => x.type === "out");
    const m: Record<string, number> = {};
    for (const x of expenseItems) {
      const cat = x.category || "Other";
      m[cat] = (m[cat] || 0) + x.amount;
    }
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    const max = Math.max(1, ...Object.values(m));
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        pct: Math.round((amount / total) * 100),
        barWidth: Math.round((amount / max) * 100),
      }));
  }, [allTransactions]);

  // Filtered transactions for the Transactions tab
  const filteredTransactions = useMemo(() => {
    const q = transactionQuery.trim().toLowerCase();
    return allTransactions.filter((x) => {
      const matchesChip =
        transactionChip === "all" || x.type === transactionChip;
      const matchesSearch =
        !q ||
        x.title.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q) ||
        x.source.toLowerCase().includes(q);
      return matchesChip && matchesSearch;
    });
  }, [allTransactions, transactionChip, transactionQuery]);

  // Open add transaction dialog with type matching active tab
  const handleOpenAddTransaction = () => {
    if (activeTab === "expenses") {
      setMoneyFormType("expense");
    } else if (activeTab === "savings") {
      setMoneyFormType("savings");
    } else if (activeTab === "debts") {
      setMoneyFormType("debt");
    } else {
      setMoneyFormType("income");
    }
    setMoneyFormOpen(true);
  };

  return (
    <div className="flex flex-col">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="font-fraunces text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          My Money
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Manage income, expenses, savings, debts, and recent money activity in
          one place.
        </p>
      </div>

      {/* No Family Alert */}
      {!familyId && !loading ? (
        <div className="my-4 flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border bg-card p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <UsersIcon className="size-5 flex-none text-foreground" />
            <span>
              Create or join a family workspace before recording money
              transactions.
            </span>
          </div>
          <Button asChild size="sm">
            <Link href="/family">Open family workspaces</Link>
          </Button>
        </div>
      ) : null}

      {/* Tabs navigation row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Money views"
          className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-muted p-1"
        >
          {TABS.map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-all sm:px-4 sm:py-2",
                  isSelected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar + Add transaction button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenAddTransaction}
            className="h-9 gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sm hover:bg-foreground/90"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            Add transaction
          </Button>
        </div>
      </div>

      {/* Main tab content */}
      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Skeleton className="h-24 rounded-[18px]" />
              <Skeleton className="h-24 rounded-[18px]" />
              <Skeleton className="col-span-2 h-24 rounded-[20px] lg:col-span-1" />
              <Skeleton className="h-24 rounded-[18px]" />
              <Skeleton className="h-24 rounded-[18px]" />
            </div>
            <Skeleton className="h-64 rounded-[20px]" />
          </div>
        ) : activeTab === "all" ? (
          /* OVERVIEW TAB */
          <div className="flex flex-col gap-4">
            {/* 5 KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
              {/* Total Income */}
              <div className="flex flex-col justify-between rounded-[18px] border border-border bg-card p-3.5 shadow-sm sm:p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Total income</span>
                  <TrendingDownIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2 font-fraunces text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCompactRwf(totalIncome, currency)}
                </div>
              </div>

              {/* Total Expenses */}
              <div className="flex flex-col justify-between rounded-[18px] border border-border bg-card p-3.5 shadow-sm sm:p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Total expenses</span>
                  <TrendingUpIcon className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-2 font-fraunces text-2xl font-semibold text-red-700 dark:text-red-400">
                  {formatCompactRwf(totalExpenses, currency)}
                </div>
              </div>

              {/* Balance Card (Bank Card Aesthetic) */}
              <div className="col-span-2 flex flex-col justify-between rounded-[20px] border border-neutral-300 bg-gradient-to-br from-white via-neutral-100 to-neutral-200 p-4 text-neutral-900 shadow-md sm:p-5 dark:border-neutral-800 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100 lg:col-span-1">
                <div className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                  Balance
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                  {formatCompactRwf(balance, currency)}
                </div>
              </div>

              {/* Savings */}
              <div className="flex flex-col justify-between rounded-[18px] border border-border bg-card p-3.5 shadow-sm sm:p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Savings</span>
                  <CoinsIcon className="size-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="mt-2 font-fraunces text-2xl font-semibold text-violet-700 dark:text-violet-400">
                  {formatCompactRwf(totalSavings, currency)}
                </div>
              </div>

              {/* Debts */}
              <div className="flex flex-col justify-between rounded-[18px] border border-border bg-card p-3.5 shadow-sm sm:p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Debts</span>
                  <LandmarkIcon className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-2 font-fraunces text-2xl font-semibold text-amber-700 dark:text-amber-400">
                  {formatCompactRwf(totalDebt, currency)}
                </div>
              </div>
            </div>

            {/* Recent Transactions Card */}
            <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-0.5">
                <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
                  Recent transactions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest money activity across personal and family records.
                </p>
              </div>

              {allTransactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  No records in this view yet.
                </div>
              ) : (
                <TransactionsTable items={allTransactions.slice(0, 8)} />
              )}
            </section>

            {/* Bottom 2 Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Next Savings Goal */}
              <SavingsGoalSnapshot
                goal={nextSavingsGoal}
                currency={currency}
                onAddGoal={() => setPlanFormOpen(true)}
              />

              {/* Debt Snapshot */}
              <DebtSnapshotCard
                loan={activeDebt}
                currency={currency}
                onAddLoan={() => {
                  setMoneyFormType("debt");
                  setMoneyFormOpen(true);
                }}
              />
            </div>
          </div>
        ) : activeTab === "income" ? (
          /* INCOME TAB */
          <div className="flex flex-col gap-4">
            {/* Top KPI Card */}
            <div className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">
                Total income
              </div>
              <div className="mt-1 font-fraunces text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
                {formatFullRwf(totalIncome, currency)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {allTransactions.filter((x) => x.type === "in").length} income
                records
              </p>
            </div>

            {/* 2 Column Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Income by category */}
              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Income by category
                  </h2>
                </div>
                {incomeCategoryBars.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    No income categories yet.
                  </p>
                ) : (
                  incomeCategoryBars.map((b) => (
                    <div
                      key={b.category}
                      className="my-3 grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm"
                    >
                      <span className="truncate font-medium text-foreground">
                        {b.category}
                      </span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                          style={{ width: `${b.barWidth}%` }}
                        />
                      </div>
                      <b className="text-right text-xs font-semibold">
                        {b.pct}%
                      </b>
                    </div>
                  ))
                )}
              </section>

              {/* Income records */}
              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Income records
                  </h2>
                </div>
                <TransactionsTable
                  items={allTransactions.filter((x) => x.type === "in")}
                />
              </section>
            </div>
          </div>
        ) : activeTab === "expenses" ? (
          /* EXPENSES TAB */
          <div className="flex flex-col gap-4">
            {/* Top KPI Card */}
            <div className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">
                Total expenses
              </div>
              <div className="mt-1 font-fraunces text-3xl font-semibold text-red-700 dark:text-red-400">
                {formatFullRwf(totalExpenses, currency)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {allTransactions.filter((x) => x.type === "out").length} expense
                records
              </p>
            </div>

            {/* 2 Column Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Spending by category */}
              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Spending by category
                  </h2>
                </div>
                {expenseCategoryBars.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    No expense categories yet.
                  </p>
                ) : (
                  expenseCategoryBars.map((b) => (
                    <div
                      key={b.category}
                      className="my-3 grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm"
                    >
                      <span className="truncate font-medium text-foreground">
                        {b.category}
                      </span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-600 dark:bg-red-400"
                          style={{ width: `${b.barWidth}%` }}
                        />
                      </div>
                      <b className="text-right text-xs font-semibold">
                        {b.pct}%
                      </b>
                    </div>
                  ))
                )}
              </section>

              {/* Expense records */}
              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Expense records
                  </h2>
                </div>
                <TransactionsTable
                  items={allTransactions.filter((x) => x.type === "out")}
                />
              </section>
            </div>
          </div>
        ) : activeTab === "savings" ? (
          /* SAVINGS TAB */
          <div className="flex flex-col gap-4">
            {/* Top KPI Card */}
            <div className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">
                Total savings
              </div>
              <div className="mt-1 font-fraunces text-3xl font-semibold text-violet-700 dark:text-violet-400">
                {formatFullRwf(totalSavings, currency)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Savings goals and deposits
              </p>
            </div>

            {/* 2 Column Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SavingsGoalSnapshot
                goal={nextSavingsGoal}
                currency={currency}
                onAddGoal={() => setPlanFormOpen(true)}
              />

              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Savings deposits
                  </h2>
                </div>
                <TransactionsTable
                  items={allTransactions.filter((x) => x.type === "save")}
                  emptyMessage="No savings deposits recorded yet."
                />
              </section>
            </div>
          </div>
        ) : activeTab === "debts" ? (
          /* DEBTS TAB */
          <div className="flex flex-col gap-4">
            {/* Top KPI Card */}
            <div className="rounded-[18px] border border-border bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">
                Outstanding debt
              </div>
              <div className="mt-1 font-fraunces text-3xl font-semibold text-amber-700 dark:text-amber-400">
                {formatFullRwf(totalDebt, currency)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                of {formatFullRwf(totalBorrowedOriginal, currency)} borrowed
              </p>
            </div>

            {/* 2 Column Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DebtSnapshotCard
                loan={activeDebt}
                currency={currency}
                onAddLoan={() => {
                  setMoneyFormType("debt");
                  setMoneyFormOpen(true);
                }}
              />

              <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-3.5 flex flex-col gap-0.5">
                  <h2 className="font-fraunces text-xl font-semibold text-foreground">
                    Repayments
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Payments made toward your debts.
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  No repayments recorded yet. Add an expense to record one.
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* TRANSACTIONS TAB */
          <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
            {/* Header: Title on left, Search on right */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
                All transactions
              </h2>
              <div className="flex h-10 min-w-[220px] items-center gap-2 rounded-xl border border-border bg-muted/60 px-3.5">
                <SearchIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={transactionQuery}
                  onChange={(e) => setTransactionQuery(e.target.value)}
                  placeholder="Search records..."
                  aria-label="Search records"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "All" },
                { key: "in", label: "Income" },
                { key: "out", label: "Expenses" },
                { key: "save", label: "Savings" },
              ].map(({ key, label }) => {
                const isSelected = transactionChip === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setTransactionChip(key as "all" | "in" | "out" | "save")
                    }
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Filtered Table */}
            <TransactionsTable
              items={filteredTransactions}
              emptyMessage="No records match this search or filter."
            />
          </section>
        )}
      </div>

      {/* MoneyFormDialog for adding transactions */}
      {familyId ? (
        <MoneyFormDialog
          familyId={familyId}
          type={moneyFormType}
          open={moneyFormOpen}
          onOpenChange={setMoneyFormOpen}
          categories={categories}
          onCategoryCreated={loadData}
          onSuccess={loadData}
        />
      ) : null}

      {/* PersonPlanForm for adding savings goals */}
      <PersonPlanForm
        open={planFormOpen}
        onOpenChange={setPlanFormOpen}
        editPlan={null}
        initialType="LONG_TERM_GOAL"
        onSuccess={loadData}
      />
    </div>
  );
}

/* ========================================================================= */
/* Reusable Sub-Components Matching "My Money · tabs (redesign).html"        */
/* ========================================================================= */

function TransactionsTable({
  items,
  emptyMessage = "No records in this view yet.",
}: {
  items: RealTransaction[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Desktop Header row (.th) */}
      <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-border pb-2.5 text-[13px] font-medium text-muted-foreground md:grid">
        <span>Record</span>
        <span>Type</span>
        <span>Category</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
      </div>

      {/* Row items (.tr) */}
      <div className="flex flex-col">
        {items.map((x) => {
          const isIncome = x.type === "in";
          const isExpense = x.type === "out";

          return (
            <div
              key={x.id}
              className="grid grid-cols-1 items-center gap-2 border-t border-border py-3 first:border-t-0 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] md:gap-3"
            >
              {/* Record Title & Source */}
              <div className="flex min-w-0 items-center justify-between md:block">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {x.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {x.source}
                  </div>
                </div>

                {/* Mobile Amount */}
                <div
                  className={cn(
                    "font-mono text-sm font-semibold md:hidden",
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isExpense
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCompactRwf(x.amount)}
                </div>
              </div>

              {/* Badges / Metadata row */}
              <div className="flex flex-wrap items-center gap-2 md:contents">
                {/* Type Badge */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                      isIncome
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : isExpense
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {isIncome ? "Income" : isExpense ? "Expense" : "Saving"}
                  </span>
                </div>

                {/* Category */}
                <div className="truncate text-xs text-muted-foreground sm:text-sm">
                  {x.category}
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground whitespace-nowrap sm:text-sm">
                  {x.date}
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                      x.status === "Received" || x.status === "Paid"
                        ? "bg-muted text-muted-foreground"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {x.status}
                  </span>
                </div>
              </div>

              {/* Desktop Amount */}
              <div
                className={cn(
                  "hidden text-right font-mono text-sm font-semibold md:block",
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isExpense
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400",
                )}
              >
                {isIncome ? "+" : "-"}
                {formatCompactRwf(x.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavingsGoalSnapshot({
  goal,
  currency,
  onAddGoal,
}: {
  goal: PersonPlan | null;
  currency: string;
  onAddGoal: () => void;
}) {
  if (!goal) {
    return (
      <section className="flex flex-col justify-between rounded-[20px] border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-fraunces text-xl font-semibold text-foreground">
              Next savings goal
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No active savings goal set yet.
          </p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddGoal}
            className="rounded-full font-semibold"
          >
            <PlusIcon className="size-4" />
            Create savings goal
          </Button>
        </div>
      </section>
    );
  }

  const saved = Number(goal.currentAmountMinorUnits || 0);
  const target = Math.max(1, Number(goal.targetAmountMinorUnits || 0));
  const remaining = Math.max(0, target - saved);
  const pct = Math.min(100, Math.round((saved / target) * 100));

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-3.5">
        <h2 className="font-fraunces text-xl font-semibold text-foreground">
          Next savings goal
        </h2>
        <p className="text-sm text-muted-foreground">{goal.title}</p>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between py-2 text-[15px]">
          <span className="text-muted-foreground">Saved</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(saved, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Target</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(target, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Remaining</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(remaining, currency)}
          </b>
        </div>
      </div>

      <div className="my-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-violet-600 transition-all dark:bg-violet-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {pct}% of your goal reached
      </p>
    </section>
  );
}

function DebtSnapshotCard({
  loan,
  currency,
  onAddLoan,
}: {
  loan: PersonalLoan | null | undefined;
  currency: string;
  onAddLoan: () => void;
}) {
  if (!loan) {
    return (
      <section className="flex flex-col justify-between rounded-[20px] border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-fraunces text-xl font-semibold text-foreground">
              Debt snapshot
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No active borrowed loans recorded.
          </p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddLoan}
            className="rounded-full font-semibold"
          >
            <PlusIcon className="size-4" />
            Record loan / debt
          </Button>
        </div>
      </section>
    );
  }

  const original = Math.max(1, Number(loan.originalAmountMinorUnits || 0));
  const paid = Number(loan.paidAmountMinorUnits || 0);
  const outstanding = Number(loan.remainingBalanceMinorUnits || 0);
  const pct = Math.min(100, Math.round((paid / original) * 100));

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-3.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-foreground">
            Debt snapshot
          </h2>
          <p className="text-sm text-muted-foreground">{loan.title}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <span className="size-1.5 rounded-full bg-current" />
          {loan.status === "ACTIVE" ? "Due soon" : loan.status}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between py-2 text-[15px]">
          <span className="text-muted-foreground">Party</span>
          <b className="font-semibold text-foreground">
            {loan.person?.name || "Family loan"}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Original loan</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(original, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Paid so far</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(paid, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Outstanding</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(outstanding, currency)}
          </b>
        </div>
        {loan.dueDate ? (
          <div className="flex justify-between border-t border-border py-2 text-[15px]">
            <span className="text-muted-foreground">Due</span>
            <b className="font-semibold text-foreground">
              {formatDisplayDate(loan.dueDate)}
            </b>
          </div>
        ) : null}
      </div>

      <div className="my-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-amber-600 transition-all dark:bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">{pct}% of the loan repaid</p>
    </section>
  );
}
