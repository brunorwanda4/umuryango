import { useCallback, useEffect, useMemo, useState } from "react";
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
    categories,
    incomeDashboard,
    expenseDashboard,
    loans,
    plans,
    allTransactions,
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
