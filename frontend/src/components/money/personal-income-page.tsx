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

type FamilySummary = {
  authority: "HEAD" | "ADMIN" | "MEMBER";
  id: string;
  name: string;
  slug: string;
};

export function PersonalIncomePage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [dashboard, setDashboard] = useState<IncomeDashboardResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => getMonthPeriod(month), [month]);

  const loadIncome = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
    loadIncome();
  }, [loadIncome]);

  const canRecordIncome = family
    ? hasCapability(family, "RECORD_INCOME")
    : false;
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
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
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
                    onChange={(event) => setMonth(event.target.value)}
                    type="month"
                    value={month}
                  />
                </label>
              </PopoverContent>
            </Popover>
            {canRecordIncome && family ? (
              <MoneyFormDialog
                categories={categories}
                familyId={family.id}
                onCategoryCreated={loadIncome}
                onSuccess={loadIncome}
                triggerSize="default"
                type="income"
              />
            ) : null}
          </div>
        }
      />
      <IncomeDashboard
        categories={incomeCategories}
        data={dashboard}
        error={error}
        familyId={family?.id ?? null}
        isLoading={isLoading}
        onRetry={loadIncome}
      />
    </div>
  );
}

function getMonthPeriod(month: string) {
  const [yearValue, monthValue] = month.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const from = new Date(Date.UTC(year, monthIndex, 1));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatMonthPeriod(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(new Date(`${from}T00:00:00`))} - ${formatter.format(
    new Date(`${to}T00:00:00`),
  )}`;
}
