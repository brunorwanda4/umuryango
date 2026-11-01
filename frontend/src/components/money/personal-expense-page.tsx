"use client";

import { useState } from "react";
import { MoneyDirectionHeader } from "@/components/common/money-section/money-direction-header";
import { MoneyDirectionShell } from "@/components/common/money-section/money-direction-shell";
import { ExpenseDashboard } from "@/components/money/expense-dashboard";
import { useExpensePageData } from "@/hooks/use-expense-page-data";
import { createTranslator } from "@/i18n/translate";
import { ExpensePageActions } from "./expense-page-actions";
import { getMonthPeriod } from "./utils";

export function PersonalExpensePage() {
  const t = createTranslator("PersonalMoney.personalExpenses");
  const [period, setPeriod] = useState(() =>
    getMonthPeriod(new Date().toISOString().slice(0, 7)),
  );

  const { categories, dashboard, error, family, isLoading, reload } =
    useExpensePageData(period);

  const expenseCategories = categories.filter(
    (c) => c.type === "EXPENSE" && c.status === "ACTIVE",
  );

  const periodMonthName = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${period.from}T00:00:00`));

  return (
    <MoneyDirectionShell>
      <MoneyDirectionHeader
        direction="expense"
        eyebrow="Outflows & Spending"
        periodLabel={periodMonthName}
        title={t((m) => m.PersonalMoney.personalExpenses.title)}
        description={t((m) => m.PersonalMoney.personalExpenses.description)}
        actions={
          <ExpensePageActions
            canRecordExpense={Boolean(family)}
            categories={categories}
            family={family}
            period={period}
            onPeriodChange={setPeriod}
            onSuccess={reload}
          />
        }
      />
      <ExpenseDashboard
        categories={expenseCategories}
        allCategories={categories}
        data={dashboard}
        error={error}
        familyId={family?.id ?? null}
        isLoading={isLoading}
        onRetry={reload}
        periodLabel={periodMonthName}
      />
    </MoneyDirectionShell>
  );
}
