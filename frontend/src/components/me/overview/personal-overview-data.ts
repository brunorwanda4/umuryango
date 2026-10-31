"use client";

import { useCallback, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { ExpenseDashboardResponse } from "@/components/money/expense-dashboard/expense-dashboard-data";
import type {
  IncomeCategory,
  IncomeDashboardResponse,
} from "@/components/money/income-dashboard/income-dashboard-data";
import {
  normalizePersonalLoans,
  type PersonalLoan,
} from "@/components/money/loans/types-and-schemas";
import type { FamilySummary } from "@/components/money/types";
import type {
  PersonalPlansResponse,
  PersonPlan,
} from "@/components/plans/types-and-schemas";
import type { CurrentUser } from "@/hooks/use-current-user";
import apiRequest from "@/service/api";

export type OverviewFamily = FamilySummary & {
  description: string | null;
  memberCount: number | null;
  defaultCurrency: string | null;
};

export type PersonalOverviewData = {
  user: CurrentUser | null;
  families: OverviewFamily[];
  plans: PersonPlan[];
  loans: PersonalLoan[];
  income: IncomeDashboardResponse | null;
  expenses: ExpenseDashboardResponse | null;
  currency: string;
  categories: IncomeCategory[];
  warnings: string[];
};

const EMPTY_DATA: PersonalOverviewData = {
  user: null,
  families: [],
  plans: [],
  loans: [],
  income: null,
  expenses: null,
  currency: "RWF",
  categories: [],
  warnings: [],
};

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function usePersonalOverviewData() {
  const [data, setData] = useState<PersonalOverviewData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [userResponse, familiesResponse, plansResponse, workspaceResponse] =
      await Promise.all([
        apiRequest<undefined, { user?: CurrentUser }>("get", "/auth/me"),
        apiRequest<undefined, FamilySummary[]>("get", "/families"),
        apiRequest<undefined, PersonalPlansResponse>("get", "/personal-plans"),
        apiRequest<undefined, FamilyDetail>(
          "get",
          "/families/personal-workspace",
        ),
      ]);

    if (!userResponse.ok || !familiesResponse.ok) {
      setError(
        userResponse.message ??
          familiesResponse.message ??
          "Your personal overview could not be loaded.",
      );
      setIsLoading(false);
      return;
    }

    const familySummaries = familiesResponse.data ?? [];
    const detailResponses = await Promise.all(
      familySummaries.map((family) =>
        apiRequest<undefined, FamilyDetail>(
          "get",
          `/families/${encodeURIComponent(family.slug)}`,
        ),
      ),
    );
    const families = familySummaries.map((family, index) => {
      const detail = detailResponses[index]?.data;
      return {
        ...family,
        description: detail?.description ?? null,
        memberCount: detail?.memberCount ?? null,
        defaultCurrency: detail?.defaultCurrency ?? null,
      };
    });

    const moneyWorkspace = workspaceResponse.data;
    let income: IncomeDashboardResponse | null = null;
    let expenses: ExpenseDashboardResponse | null = null;
    let loans: PersonalLoan[] = [];
    let categories: IncomeCategory[] = [];
    const warnings: string[] = [];

    if (workspaceResponse.ok && moneyWorkspace) {
      const range = currentMonthRange();
      const [
        incomeResponse,
        expenseResponse,
        loansResponse,
        categoriesResponse,
      ] = await Promise.all([
        apiRequest<undefined, IncomeDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(moneyWorkspace.id)}/money/transactions/mine/dashboard?type=INCOME&from=${range.from}&to=${range.to}`,
        ),
        apiRequest<undefined, ExpenseDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(moneyWorkspace.id)}/money/transactions/mine/dashboard?type=EXPENSE&from=${range.from}&to=${range.to}`,
        ),
        apiRequest<undefined, unknown>(
          "get",
          `/families/${encodeURIComponent(moneyWorkspace.id)}/money/loans/personal?limit=100`,
        ),
        apiRequest<undefined, IncomeCategory[]>(
          "get",
          `/families/${encodeURIComponent(moneyWorkspace.id)}/money/categories/mine`,
        ),
      ]);
      income = incomeResponse.data ?? null;
      categories = categoriesResponse.ok ? (categoriesResponse.data ?? []) : [];
      if (!categoriesResponse.ok && categoriesResponse.statusCode !== 404) {
        warnings.push("Money categories could not be loaded.");
      }
      expenses = expenseResponse.data ?? null;
      loans = loansResponse.ok
        ? normalizePersonalLoans(loansResponse.data)
        : [];
      if (!incomeResponse.ok || !expenseResponse.ok) {
        warnings.push("Some money information is temporarily unavailable.");
      }
      if (!loansResponse.ok) {
        warnings.push("Loans and debts could not be loaded.");
      }
    } else {
      warnings.push("Personal money information could not be loaded.");
    }

    if (!plansResponse.ok) {
      warnings.push("Plans could not be loaded.");
    }
    if (detailResponses.some((response) => !response.ok)) {
      warnings.push("Some family details could not be loaded.");
    }

    setData({
      user: userResponse.data?.user ?? null,
      families,
      plans: plansResponse.data?.plans ?? [],
      loans,
      categories,
      income,
      expenses,
      currency: moneyWorkspace?.defaultCurrency ?? "RWF",
      warnings,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, isLoading, reload: load };
}

export function addMinorUnits(...values: Array<string | null | undefined>) {
  return values.reduce<bigint>(
    (total, value) => total + BigInt(value || "0"),
    BigInt(0),
  );
}
