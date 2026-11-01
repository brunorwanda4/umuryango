"use client";

import { useState } from "react";
import { MoneyDirectionHeader } from "@/components/common/money-section/money-direction-header";
import { MoneyDirectionShell } from "@/components/common/money-section/money-direction-shell";
import { IncomeDashboard } from "@/components/money/income-dashboard";
import { useIncomePageData } from "@/hooks/use-income-page-data";
import { createTranslator } from "@/i18n/translate";
import { IncomePageActions } from "./income-page-actions";
import { getMonthPeriod } from "./utils";

export function PersonalIncomePage() {
  const t = createTranslator("PersonalMoney.personalIncome");
  const [period, setPeriod] = useState(() =>
    getMonthPeriod(new Date().toISOString().slice(0, 7)),
  );

  const { categories, dashboard, error, family, isLoading, reload } =
    useIncomePageData(period);

  const incomeCategories = categories.filter(
    (c) => c.type === "INCOME" && c.status === "ACTIVE",
  );

  const periodMonthName = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${period.from}T00:00:00`));

  return (
    <MoneyDirectionShell>
      <MoneyDirectionHeader
        direction="income"
        eyebrow="Inflows & Earnings"
        periodLabel={periodMonthName}
        title={t((m) => m.PersonalMoney.personalIncome.title)}
        description={t((m) => m.PersonalMoney.personalIncome.description)}
        actions={
          <IncomePageActions
            canRecordIncome={Boolean(family)}
            categories={categories}
            family={family}
            period={period}
            onPeriodChange={setPeriod}
            onSuccess={reload}
          />
        }
      />
      <IncomeDashboard
        categories={incomeCategories}
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
