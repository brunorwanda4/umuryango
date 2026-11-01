import { useCallback, useEffect, useMemo, useState } from "react";
import type { SharedMoneyPeriodOption } from "@/components/common/money-overview";
import {
  aggregateCategoryBreakdown,
  buildCashflowBuckets,
  type PersonalMoneyPeriod,
  resolvePersonalPeriodRange,
} from "@/components/common/money-overview/money-overview-utils";
import type {
  SharedCategoryItem,
  SharedTransactionItem,
} from "@/components/common/money-overview/types";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { ExpenseDashboardResponse } from "@/components/money/expense-dashboard/expense-dashboard-data";
import type { IncomeDashboardResponse } from "@/components/money/income-dashboard/income-dashboard-data";
import {
  normalizePersonalLoans,
  type PersonalLoan,
} from "@/components/money/loans/types-and-schemas";
import type { MoneyFormCategory } from "@/components/money/money-form-dialog";
import type {
  PersonalPlansResponse,
  PersonPlan,
} from "@/components/plans/types-and-schemas";
import apiRequest from "@/service/api";
import { formatDisplayDate, paymentMethodLabel } from "./formatters";
import type { RealTransaction } from "./types";

export function usePersonalMoney() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("RWF");
  const [loading, setLoading] = useState(true);

  // Period state
  const [period, setPeriod] = useState<PersonalMoneyPeriod>("this_month");

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

  const periodOptions: SharedMoneyPeriodOption[] = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: "this_month", label: "This Month" },
      { value: "last_month", label: "Last Month" },
      { value: "this_year", label: `Year ${currentYear}` },
    ];
  }, []);

  const { label: periodLabel } = useMemo(
    () => resolvePersonalPeriodRange(period),
    [period],
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    const workspaceResponse = await apiRequest<undefined, FamilyDetail>(
      "get",
      "/families/personal-workspace",
    );
    const family = workspaceResponse.data;

    if (!workspaceResponse.ok || !family) {
      setFamilyId(null);
      setLoading(false);
      return;
    }

    setFamilyId(family.id);
    setCurrency(family.defaultCurrency);

    const { from, to } = resolvePersonalPeriodRange(period);

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
  }, [period]);

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
        rawAmountMinorUnits: r.amountMinorUnits,
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
        rawAmountMinorUnits: r.amountMinorUnits,
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

  // Financial totals calculated safely with BigInt
  const totalIncomeMinorUnits = useMemo(() => {
    if (incomeDashboard?.summary?.periodTotalMinorUnits) {
      return String(incomeDashboard.summary.periodTotalMinorUnits);
    }
    return (incomeDashboard?.records ?? [])
      .reduce((sum, r) => sum + BigInt(r.amountMinorUnits || "0"), 0n)
      .toString();
  }, [incomeDashboard]);

  const totalExpensesMinorUnits = useMemo(() => {
    if (expenseDashboard?.summary?.periodTotalMinorUnits) {
      return String(expenseDashboard.summary.periodTotalMinorUnits);
    }
    return (expenseDashboard?.records ?? [])
      .reduce((sum, r) => sum + BigInt(r.amountMinorUnits || "0"), 0n)
      .toString();
  }, [expenseDashboard]);

  const balanceMinorUnits = useMemo(() => {
    return (
      BigInt(totalIncomeMinorUnits || "0") -
      BigInt(totalExpensesMinorUnits || "0")
    ).toString();
  }, [totalIncomeMinorUnits, totalExpensesMinorUnits]);

  // Backward-compatibility number values
  const totalIncome = Number(totalIncomeMinorUnits) || 0;
  const totalExpenses = Number(totalExpensesMinorUnits) || 0;
  const balance = Number(balanceMinorUnits) || 0;

  // Category breakdown
  const incomeCategoryBreakdown: SharedCategoryItem[] = useMemo(() => {
    const records = incomeDashboard?.records ?? [];
    if (records.length > 0) {
      return aggregateCategoryBreakdown(
        records.map((r) => ({
          categoryId: r.categoryId,
          categoryName: r.category?.name,
          amountMinorUnits: r.amountMinorUnits,
          color: r.category?.color,
        })),
        totalIncomeMinorUnits,
      );
    }
    const byCat = incomeDashboard?.byCategory ?? [];
    return aggregateCategoryBreakdown(
      byCat.map((c) => ({
        categoryId: c.category,
        categoryName: c.category,
        amountMinorUnits: c.amountMinorUnits,
      })),
      totalIncomeMinorUnits,
    );
  }, [incomeDashboard, totalIncomeMinorUnits]);

  const expenseCategoryBreakdown: SharedCategoryItem[] = useMemo(() => {
    const records = expenseDashboard?.records ?? [];
    if (records.length > 0) {
      return aggregateCategoryBreakdown(
        records.map((r) => ({
          categoryId: r.categoryId,
          categoryName: r.category?.name,
          amountMinorUnits: r.amountMinorUnits,
          color: r.category?.color,
        })),
        totalExpensesMinorUnits,
      );
    }
    const byCat = expenseDashboard?.byCategory ?? [];
    return aggregateCategoryBreakdown(
      byCat.map((c) => ({
        categoryId: c.category,
        categoryName: c.category,
        amountMinorUnits: c.amountMinorUnits,
      })),
      totalExpensesMinorUnits,
    );
  }, [expenseDashboard, totalExpensesMinorUnits]);

  // Cashflow points
  const cashFlowPoints = useMemo(() => {
    return buildCashflowBuckets(
      (incomeDashboard?.records ?? []).map((r) => ({
        date: r.date,
        amountMinorUnits: r.amountMinorUnits,
      })),
      (expenseDashboard?.records ?? []).map((r) => ({
        date: r.date,
        amountMinorUnits: r.amountMinorUnits,
      })),
      period,
    );
  }, [incomeDashboard, expenseDashboard, period]);

  // Shared transaction items for Ledger
  const sharedTransactions: SharedTransactionItem[] = useMemo(() => {
    return allTransactions.map((tx) => ({
      id: tx.id,
      title: tx.title,
      subtitle: `${tx.category}${tx.source ? ` • ${tx.source}` : ""}`,
      type: tx.type === "in" ? "income" : "expense",
      amountMinorUnits: tx.rawAmountMinorUnits ?? String(tx.amount),
      currency,
      date: tx.date,
      rawDate: tx.rawDate,
      status: tx.status,
      statusVariant:
        tx.status === "Received" || tx.status === "Paid"
          ? "success"
          : tx.status === "Pending"
            ? "pending"
            : "neutral",
      category: tx.category,
      paymentMethod: tx.source,
    }));
  }, [allTransactions, currency]);

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

  const activeDebt = useMemo(() => {
    return borrowedLoans.find((l) => l.status === "ACTIVE") || borrowedLoans[0];
  }, [borrowedLoans]);

  const openIncomeDialog = useCallback(() => {
    setMoneyFormType("income");
    setMoneyFormOpen(true);
  }, []);

  const openExpenseDialog = useCallback(() => {
    setMoneyFormType("expense");
    setMoneyFormOpen(true);
  }, []);

  const openDebtDialog = useCallback(() => {
    setMoneyFormType("debt");
    setMoneyFormOpen(true);
  }, []);

  const openGoalDialog = useCallback(() => {
    setPlanFormOpen(true);
  }, []);

  return {
    familyId,
    currency,
    loading,
    period,
    setPeriod,
    periodOptions,
    periodLabel,
    categories,
    incomeDashboard,
    expenseDashboard,
    loans,
    plans,
    allTransactions,
    sharedTransactions,
    cashFlowPoints,
    incomeCategoryBreakdown,
    expenseCategoryBreakdown,
    totalIncomeMinorUnits,
    totalExpensesMinorUnits,
    balanceMinorUnits,
    totalIncome,
    totalExpenses,
    balance,
    savingsPlans,
    totalSavings,
    nextSavingsGoal,
    borrowedLoans,
    totalDebt,
    activeDebt,
    moneyFormOpen,
    setMoneyFormOpen,
    moneyFormType,
    setMoneyFormType,
    planFormOpen,
    setPlanFormOpen,
    openIncomeDialog,
    openExpenseDialog,
    openDebtDialog,
    openGoalDialog,
    loadData,
  };
}
