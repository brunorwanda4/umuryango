"use client";

import { useMemo } from "react";
import { MoneyMetricCards } from "../money/money-metric-cards";
import type { MoneyOverview } from "../money/types";
import {
  formatCompactMinorUnits,
  formatMinorUnits,
  formatOptionalMoney,
  normalizeMoneyOverview,
  toChartNumber,
} from "../money/utils";
import { FamilyFinanceCharts } from "./family-finance-charts";
import {
  type AmountValue,
  getExpenseCategories,
  getIncomeSources,
  getRecentTransactions,
} from "./family-finance-helpers";
import {
  ExpenseCategoriesTable,
  IncomeSourcesTable,
  RecentTransactionsTable,
} from "./family-finance-tables";
import type { FamilyDetail } from "./types";

export function FamilyFinanceDashboard({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const normalizedMoney = normalizeMoneyOverview(money ?? undefined);
  const currency = normalizedMoney?.currency ?? family.defaultCurrency;

  return (
    <section className="flex flex-col gap-4" aria-label="Finance dashboard">
      <FamilyFinanceDashboardContent
        currency={currency}
        money={normalizedMoney}
        familySlug={family.slug}
      />
    </section>
  );
}

function FamilyFinanceDashboardContent({
  currency,
  money,
  familySlug,
}: {
  currency: string;
  money: MoneyOverview | null;
  familySlug: string;
}) {
  const displayCurrency = currency;
  const records = money?.records ?? [];

  const formatAmount = useMemo(
    () => (amount: AmountValue) => formatOptionalMoney(amount, displayCurrency),
    [displayCurrency],
  );

  const cashFlowData = useMemo(
    () =>
      (money?.cashFlow ?? []).map((point) => ({
        label: point.label,
        income: toChartNumber(point.incomeMinorUnits),
        expenses: toChartNumber(point.expenseMinorUnits),
      })),
    [money],
  );

  const expenseCategoryRows = useMemo(
    () => getExpenseCategories(records),
    [records],
  );

  const incomeSourceRows = useMemo(() => getIncomeSources(records), [records]);

  const transactionRows = useMemo(
    () => getRecentTransactions(records),
    [records],
  );

  const pieChartData = useMemo(
    () =>
      expenseCategoryRows.map((row) => ({
        name: row.name,
        amount: toChartNumber(row.amount),
      })),
    [expenseCategoryRows],
  );

  const incomePieChartData = useMemo(
    () =>
      incomeSourceRows.map((row) => ({
        name: row.name,
        amount: toChartNumber(row.amount),
      })),
    [incomeSourceRows],
  );

  const formatChartAmount = (value: unknown) =>
    formatMinorUnits(value, displayCurrency);

  const formatCompactChartAmount = (value: unknown) =>
    formatCompactMinorUnits(value, displayCurrency);

  return (
    <div className="grid gap-6">
      <MoneyMetricCards
        currency={displayCurrency}
        familySlug={familySlug}
        money={money}
      />

      <FamilyFinanceCharts
        cashFlowData={cashFlowData}
        pieChartData={pieChartData}
        incomePieChartData={incomePieChartData}
        formatChartAmount={formatChartAmount}
        formatCompactChartAmount={formatCompactChartAmount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseCategoriesTable
          data={expenseCategoryRows.slice(0, 5)}
          formatAmount={formatAmount}
          isDemo={false}
        />

        <IncomeSourcesTable
          data={incomeSourceRows}
          formatAmount={formatAmount}
        />
      </div>

      <RecentTransactionsTable
        data={transactionRows}
        formatAmount={formatAmount}
      />
    </div>
  );
}
