"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import apiRequest from "@/service/api";
import {
  MOCK_CURRENCY,
  MOCK_EXPENSE_CATEGORIES,
  MOCK_INCOME_SOURCES,
  MOCK_MONTHLY_CASHFLOW,
} from "../money/mock-finance-data";
import type { MoneyOverview } from "../money/types";
import {
  formatCompactMinorUnits,
  formatMinorUnits,
  formatOptionalMoney,
  normalizeMoneyOverview,
  toChartNumber,
} from "../money/utils";
import { FamilyFinanceCharts } from "./family-finance-charts";
import { DemoGoalCards } from "./family-finance-goals";
import {
  type AmountValue,
  getDemoTransactions,
  getExpenseCategories,
  getIncomeSources,
  getRecentTransactions,
} from "./family-finance-helpers";
import {
  PersistedFinanceCards,
} from "./family-finance-metrics";
import { FamilyFinanceDashboardSkeleton } from "./family-finance-skeleton";
import {
  ExpenseCategoriesTable,
  IncomeSourcesTable,
  RecentTransactionsTable,
} from "./family-finance-tables";
import type { FamilyDetail } from "./types";
import { MoneyMetricCards } from "../money/money-metric-cards";

type DashboardMoneyState =
  | { status: "loading" }
  | { status: "success"; money: MoneyOverview | null; message?: string };

export function FamilyFinanceDashboard({ family }: { family: FamilyDetail }) {
  const [state, setState] = useState<DashboardMoneyState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    setState({ status: "loading" });

    (async () => {
      const response = await apiRequest<undefined, MoneyOverview>(
        "get",
        `/families/${encodeURIComponent(family.id)}/money/overview?period=month`,
      );

      if (!active) return;

      setState({
        status: "success",
        money: response.ok ? normalizeMoneyOverview(response.data) : null,
        message: response.ok
          ? undefined
          : (response.message ??
            "Money records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [family.id]);

  if (state.status === "loading") {
    return <FamilyFinanceDashboardSkeleton />;
  }

  const currency = state.money?.currency ?? family.defaultCurrency;
  const isDemo = !state.money?.records || state.money.records.length === 0;

  return (
    <section className="flex flex-col gap-4" aria-label="Finance dashboard">


      {state.message ? (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved money records</AlertTitle>
          <AlertDescription>
            The dashboard is ready for persisted family money records. Until the
            API returns them, this section shows clearly labeled demo data.
            Detail: {state.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <FamilyFinanceDashboardContent
        currency={currency}
        isDemo={isDemo}
        money={state.money}
      />
    </section>
  );
}

function FamilyFinanceDashboardContent({
  currency,
  isDemo,
  money,
}: {
  currency: string;
  isDemo: boolean;
  money: MoneyOverview | null;
}) {
  const displayCurrency = isDemo ? MOCK_CURRENCY : currency;
  const records = money?.records ?? [];

  const formatMajorMoney = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: displayCurrency,
        maximumFractionDigits: 0,
      }).format(amount),
    [displayCurrency],
  );

  const formatAmount = useMemo(
    () => (amount: AmountValue) => {
      if (isDemo) {
        return typeof amount === "number"
          ? formatMajorMoney(amount)
          : "No records";
      }

      return formatOptionalMoney(amount, displayCurrency);
    },
    [displayCurrency, formatMajorMoney, isDemo],
  );

  const cashFlowData = useMemo(
    () =>
      isDemo
        ? MOCK_MONTHLY_CASHFLOW.map((point) => ({
            label: point.month,
            income: point.income,
            expenses: point.expenses,
          }))
        : (money?.cashFlow ?? []).map((point) => ({
            label: point.label,
            income: toChartNumber(point.incomeMinorUnits),
            expenses: toChartNumber(point.expenseMinorUnits),
          })),
    [isDemo, money],
  );

  const expenseCategoryRows = useMemo(
    () => (isDemo ? MOCK_EXPENSE_CATEGORIES : getExpenseCategories(records)),
    [isDemo, records],
  );

  const incomeSourceRows = useMemo(
    () => (isDemo ? MOCK_INCOME_SOURCES : getIncomeSources(records)),
    [isDemo, records],
  );

  const transactionRows = useMemo(
    () => (isDemo ? getDemoTransactions() : getRecentTransactions(records)),
    [isDemo, records],
  );

  const pieChartData = useMemo(
    () =>
      expenseCategoryRows.map((row) => ({
        name: row.name,
        amount:
          isDemo && typeof row.amount === "number"
            ? row.amount
            : toChartNumber(row.amount),
      })),
    [expenseCategoryRows, isDemo],
  );

  const formatChartAmount = (value: unknown) =>
    isDemo
      ? formatMajorMoney(Number(value))
      : formatMinorUnits(value, displayCurrency);

  const formatCompactChartAmount = (value: unknown) =>
    isDemo
      ? new Intl.NumberFormat("en", {
          compactDisplay: "short",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(Number(value))
      : formatCompactMinorUnits(value, displayCurrency);

  return (
    <div className="grid gap-6">

      <MoneyMetricCards
        currency={displayCurrency}
        familySlug=""
        money={money}
      />

      <FamilyFinanceCharts
        cashFlowData={cashFlowData}
        pieChartData={pieChartData}
        formatChartAmount={formatChartAmount}
        formatCompactChartAmount={formatCompactChartAmount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseCategoriesTable
          data={expenseCategoryRows.slice(0, 5)}
          formatAmount={formatAmount}
          isDemo={isDemo}
        />

        <IncomeSourcesTable
          data={incomeSourceRows}
          formatAmount={formatAmount}
        />
      </div>

      {isDemo ? (
        <DemoGoalCards formatAmount={formatAmount} />
      ) : (
        <PersistedFinanceCards
          currency={displayCurrency}
          formatAmount={formatAmount}
          money={money}
        />
      )}

      <RecentTransactionsTable
        data={transactionRows}
        formatAmount={formatAmount}
      />
    </div>
  );
}
