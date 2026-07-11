"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { IncomeDashboard } from "@/components/money/income-dashboard";
import type {
  IncomeCategory,
  IncomeDashboardResponse,
} from "@/components/money/income-dashboard/income-dashboard-data";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { formatMonthPeriod, getMonthPeriod } from "./utils";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Lightweight family listing shape returned by GET /families?limit=1. */
export type FamilySummary = {
  authority: "HEAD" | "ADMIN" | "MEMBER";
  id: string;
  name: string;
  slug: string;
};

// ---------------------------------------------------------------------------
// Hook: useIncomePageData
// ---------------------------------------------------------------------------

/**
 * Encapsulates all data fetching for the personal income page.
 * Returns the family, categories, dashboard data, loading/error state, and a
 * `reload` callback that can be passed to child components for optimistic
 * refresh after mutations.
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
          `/families/${encodeURIComponent(familySummary.id)}/money/categories`,
        ),
        apiRequest<undefined, IncomeDashboardResponse>(
          "get",
          `/families/${encodeURIComponent(
            familySummary.id,
          )}/money/transactions/mine/dashboard?type=INCOME&from=${period.from}&to=${period.to}`,
        ),
      ]);

    if (!familyResponse.ok || !familyResponse.data) {
      setError(
        familyResponse.message ?? "Family workspace could not be loaded.",
      );
    } else if (!categoriesResponse.ok) {
      setError(
        categoriesResponse.message ?? "Income categories could not be loaded.",
      );
    } else if (!dashboardResponse.ok || !dashboardResponse.data) {
      setError(
        dashboardResponse.message ?? "Income records could not be loaded.",
      );
    } else {
      setFamily(familyResponse.data);
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

// ---------------------------------------------------------------------------
// Component: IncomeMonthPicker
// ---------------------------------------------------------------------------

/**
 * A popover that lets the user pick a calendar month.
 * Renders the formatted period label as the trigger button and an `<input
 * type="month">` inside the popover content.
 *
 * Reusable for any page that needs month-range selection.
 */
export function IncomeMonthPicker({
  month,
  onMonthChange,
}: {
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const period = useMemo(() => getMonthPeriod(month), [month]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <span>{formatMonthPeriod(period.from, period.to)}</span>
          <CalendarDaysIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <label
          className="flex flex-col gap-2 font-medium text-sm"
          htmlFor="income-month"
        >
          Income month
          <Input
            aria-label="Income month"
            id="income-month"
            max="9999-12"
            min="2000-01"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={month}
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Component: IncomePageActions
// ---------------------------------------------------------------------------

/**
 * The action bar rendered in the page header: month picker on the left and
 * (when the user has RECORD_INCOME permission) an "Add income" button on the
 * right.
 *
 * Split out so it can be unit-tested or reused in a modal/sheet context.
 */
export function IncomePageActions({
  categories,
  canRecordIncome,
  family,
  month,
  onMonthChange,
  onSuccess,
}: {
  canRecordIncome: boolean;
  categories: IncomeCategory[];
  family: FamilyDetail | null;
  month: string;
  onMonthChange: (month: string) => void;
  onSuccess: () => void | Promise<void>;
}) {
  return (
    <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
      <IncomeMonthPicker month={month} onMonthChange={onMonthChange} />
      {canRecordIncome && family ? (
        <MoneyFormDialog
          categories={categories}
          familyId={family.id}
          onCategoryCreated={onSuccess}
          onSuccess={onSuccess}
          triggerSize="default"
          type="income"
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page: PersonalIncomePage
// ---------------------------------------------------------------------------

/**
 * Full personal income page.
 *
 * Composes `useIncomePageData`, `IncomePageActions`, and `IncomeDashboard`
 * together. Keep this component thin — business logic belongs in the hook,
 * UI sub-trees belong in the extracted components above.
 */
export function PersonalIncomePage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const period = useMemo(() => getMonthPeriod(month), [month]);

  const { categories, dashboard, error, family, isLoading, reload } =
    useIncomePageData(period);

  const canRecordIncome = family ? hasCapability(family, "RECORD_INCOME") : false;

  // Only pass ACTIVE INCOME categories to the dashboard filter chip list.
  const incomeCategories = categories.filter(
    (category) => category.type === "INCOME" && category.status === "ACTIVE",
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Income"
        iconImage="/images/icons/income.png"
        description="Track money you receive from work, business, contributions, gifts, and family support."
        badge={family?.name}
        actions={
          <IncomePageActions
            canRecordIncome={canRecordIncome}
            categories={categories}
            family={family}
            month={month}
            onMonthChange={setMonth}
            onSuccess={reload}
          />
        }
      />
      <IncomeDashboard
        categories={incomeCategories}
        data={dashboard}
        error={error}
        familyId={family?.id ?? null}
        isLoading={isLoading}
        onRetry={reload}
      />
    </div>
  );
}
