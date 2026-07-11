"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import { ExpenseDashboard } from "@/components/money/expense-dashboard";
import { useExpensePageData } from "@/hooks/use-expense-page-data";
import { hasCapability } from "@/lib/family-access";
import { ExpensePageActions } from "./expense-page-actions";
import { getMonthPeriod } from "./utils";

export function PersonalExpensePage() {
	const [month, setMonth] = useState(() =>
		new Date().toISOString().slice(0, 7),
	);

	const period = useMemo(() => getMonthPeriod(month), [month]);

	const { categories, dashboard, error, family, isLoading, reload } =
		useExpensePageData(period);

	const canRecordExpense = family
		? hasCapability(family, "RECORD_EXPENSE")
		: false;

	const expenseCategories = categories.filter(
		(c) => c.type === "EXPENSE" && c.status === "ACTIVE",
	);

	return (
		<div className="flex flex-col gap-5">
			<PageTitle
				title="Expenses"
				iconImage="/images/icons/expense.png"
				description="Track money you spend on food, transport, health, rent, and other personal costs."
				badge={family?.name}
				actions={
					<ExpensePageActions
						canRecordExpense={canRecordExpense}
						categories={categories}
						family={family}
						month={month}
						onMonthChange={setMonth}
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
