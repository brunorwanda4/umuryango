"use client";

import { useCallback, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type {
  IncomeCategory,
  IncomeDashboardResponse,
} from "@/components/money/income-dashboard/income-dashboard-data";
import type { FamilySummary } from "@/components/money/types";
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

    // Step 1 – resolve the user's first family workspace.
    const familiesResponse = await apiRequest<undefined, FamilySummary[]>(
      "get",
      "/families?limit=1",
    );
    const familySummary = familiesResponse.data?.[0];

    if (!familiesResponse.ok || !familySummary) {
      setFamily(null);
      setCategories([]);
      setDashboard(null);
      setError(
        familiesResponse.ok
          ? "Create or join a family workspace before recording income."
          : (familiesResponse.message ??
              "Family workspace could not be loaded."),
      );
      setIsLoading(false);
      return;
    }

    // Step 2 – fetch full family detail, categories, and dashboard in parallel.
    const [familyResponse, categoriesResponse, dashboardResponse] =
      await Promise.all([
        apiRequest<undefined, FamilyDetail>(
          "get",
          `/families/${encodeURIComponent(familySummary.slug)}`,
        ),
        apiRequest<undefined, IncomeCategory[]>(
          "get",
          `/families/${encodeURIComponent(familySummary.id)}/money/categories/mine`,
        ),
        apiRequest<undefined, IncomeDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(
            familySummary.id,
          )}/money/transactions/mine/dashboard?type=INCOME&from=${period.from}&to=${period.to}`,
        ),
      ]);

    const categoriesAreEmpty = categoriesResponse.statusCode === 404;

    setFamily(
      familyResponse.ok && familyResponse.data ? familyResponse.data : null,
    );
    setCategories(categoriesResponse.ok ? (categoriesResponse.data ?? []) : []);
    setDashboard(
      dashboardResponse.ok && dashboardResponse.data
        ? dashboardResponse.data
        : null,
    );

    if (!familyResponse.ok || !familyResponse.data) {
      setError(
        familyResponse.message ?? "Family workspace could not be loaded.",
      );
    } else if (!categoriesResponse.ok && !categoriesAreEmpty) {
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
