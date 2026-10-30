"use client";

import { useCallback, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type {
  IncomeCategory,
  IncomeDashboardResponse,
} from "@/components/money/income-dashboard/income-dashboard-data";
import apiRequest from "@/service/api";

/**
 * Fetches and manages all data needed by the personal income page:
 * family detail, income categories, and the dashboard response.
 *
 * @param period - `{ from, to }` ISO date strings for the selected month.
 *
 * @example
 * const { family, categories, dashboard, isLoading, error, reload } =
 *   useIncomePageData({ from: "2025-01-01", to: "2025-01-31" });
 */
export function useIncomePageData(period: { from: string; to: string }) {
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [dashboard, setDashboard] = useState<IncomeDashboardResponse | null>(
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
      apiRequest<undefined, IncomeCategory[]>(
        "get",
        `/families/${encodeURIComponent(workspace.id)}/money/categories/mine`,
      ),
      apiRequest<undefined, IncomeDashboardResponse>(
        "get",
        `/families/${encodeURIComponent(
          workspace.id,
        )}/money/transactions/mine/dashboard?type=INCOME&from=${period.from}&to=${period.to}`,
      ),
    ]);

    const categoriesAreEmpty = categoriesResponse.statusCode === 404;

    setFamily(workspace);
    setCategories(categoriesResponse.ok ? (categoriesResponse.data ?? []) : []);
    setDashboard(
      dashboardResponse.ok && dashboardResponse.data
        ? dashboardResponse.data
        : null,
    );

    if (!categoriesResponse.ok && !categoriesAreEmpty) {
      setError(
        categoriesResponse.message ?? "Income categories could not be loaded.",
      );
    } else if (!dashboardResponse.ok || !dashboardResponse.data) {
      setError(
        dashboardResponse.message ?? "Income records could not be loaded.",
      );
    }

    setIsLoading(false);
  }, [period.from, period.to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, dashboard, error, family, isLoading, reload };
}
