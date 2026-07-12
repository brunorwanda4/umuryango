"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import { IncomeDashboard } from "@/components/money/income-dashboard";
import { useIncomePageData } from "@/hooks/use-income-page-data";
import { IncomePageActions } from "./income-page-actions";
import { getMonthPeriod } from "./utils";

export function PersonalIncomePage() {
	const [month, setMonth] = useState(() =>
		new Date().toISOString().slice(0, 7),
	);

	const period = useMemo(() => getMonthPeriod(month), [month]);

	const { categories, dashboard, error, family, isLoading, reload } =
		useIncomePageData(period);

	const incomeCategories = categories.filter(
		(c) => c.type === "INCOME" && c.status === "ACTIVE",
	);

	return (
		<div className="flex flex-col gap-5">
			<PageTitle
				title="Income"
				iconImage="/images/icons/income.png"
				description="Track your personal income from work, business, gifts, and other sources."
				actions={
					<IncomePageActions
						canRecordIncome={Boolean(family)}
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
