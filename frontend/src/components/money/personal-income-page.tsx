"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import { IncomeDashboard } from "@/components/money/income-dashboard";
import { hasCapability } from "@/lib/family-access";
import { useIncomePageData } from "@/hooks/use-income-page-data";
import { getMonthPeriod } from "./utils";
import { IncomePageActions } from "./income-page-actions";

export function PersonalIncomePage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const period = useMemo(() => getMonthPeriod(month), [month]);

  const { categories, dashboard, error, family, isLoading, reload } =
    useIncomePageData(period);

  const canRecordIncome = family
    ? hasCapability(family, "RECORD_INCOME")
    : false;

  const incomeCategories = categories.filter(
    (c) => c.type === "INCOME" && c.status === "ACTIVE",
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
