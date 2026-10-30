"use client";

import { useCallback, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type {
  ExpenseCategory,
  ExpenseDashboardResponse,
} from "@/components/money/expense-dashboard/expense-dashboard-data";
import apiRequest from "@/service/api";

/**
 * Fetches and manages all data needed by the personal expenses page:
 * family detail, expense categories, and the dashboard response.
 *
 * @param period - `{ from, to }` ISO date strings for the selected month.
 *
 * @example
 * const { family, categories, dashboard, isLoading, error, reload } =
 *   useExpensePageData({ from: "2025-01-01", to: "2025-01-31" });
 */
export function useExpensePageData(period: { from: string; to: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [dashboard, setDashboard] = useState<ExpenseDashboardResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const workspaceResponse = await apiRequest<undefined, FamilyDetail>(
      "get",
      "/families/personal-workspace",
    );
    const workspace = workspaceResponse.data;

    if (!workspaceResponse.ok || !workspace) {
      setFamily(null);
      setCategories([]);
      setDashboard(null);
      setError(
        workspaceResponse.message ??
          "Your personal money workspace could not be loaded.",
      );
      setIsLoading(false);
      return;
    }

    const [categoriesResponse, dashboardResponse] = await Promise.all([
      apiRequest<undefined, ExpenseCategory[]>(
        "get",
        `/families/${encodeURIComponent(workspace.id)}/money/categories/mine`,
      ),
      apiRequest<undefined, ExpenseDashboardResponse>(
        "get",
        `/families/${encodeURIComponent(
          workspace.id,
        )}/money/transactions/mine/dashboard?type=EXPENSE&from=${period.from}&to=${period.to}`,
      ),
    ]);

    if (!categoriesResponse.ok) {
      setError(
        categoriesResponse.message ?? "Expense categories could not be loaded.",
      );
    } else if (!dashboardResponse.ok || !dashboardResponse.data) {
      setError(
        dashboardResponse.message ?? "Expense records could not be loaded.",
      );
    } else {
      setFamily(workspace);
      setCategories(categoriesResponse.data ?? []);
      setDashboard(dashboardResponse.data);
    }

    setIsLoading(false);
  }, [period.from, period.to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, dashboard, error, family, isLoading, reload };
}
