"use client";

import { ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
import { ExpenseDashboard } from "@/components/money/expense-dashboard";
import { useExpensePageData } from "@/hooks/use-expense-page-data";
import { ExpensePageActions } from "./expense-page-actions";
import { getMonthPeriod } from "./utils";

export function PersonalExpensePage() {
  const [period, setPeriod] = useState(() =>
    getMonthPeriod(new Date().toISOString().slice(0, 7)),
  );

  const { categories, dashboard, error, family, isLoading, reload } =
    useExpensePageData(period);

  const expenseCategories = categories.filter(
    (c) => c.type === "EXPENSE" && c.status === "ACTIVE",
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Expenses"
        icon={
          <SidebarIcon
            className="size-6"
            icon={{
              image: { src: "/images/icons/expense.png" },
              line: ArrowUpIcon,
            }}
          />
        }
        description="Track your personal spending on food, transport, health, rent, and other costs."
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
        data={dashboard}
        error={error}
        familyId={family?.id ?? null}
        isLoading={isLoading}
        onRetry={reload}
      />
    </div>
  );
}
