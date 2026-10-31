"use client";

import { ArrowDownIcon } from "lucide-react";
import { useState } from "react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
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

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title={t((m) => m.PersonalMoney.personalIncome.title)}
        icon={
          <SidebarIcon
            className="size-6"
            icon={{
              image: { src: "/images/icons/income.png" },
              line: ArrowDownIcon,
            }}
          />
        }
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
        data={dashboard}
        error={error}
        familyId={family?.id ?? null}
        isLoading={isLoading}
        onRetry={reload}
      />
    </div>
  );
}
