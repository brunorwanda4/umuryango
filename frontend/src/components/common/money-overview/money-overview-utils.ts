import type { SharedCashFlowPoint, SharedCategoryItem } from "./types";

export type PersonalMoneyPeriod = "this_month" | "last_month" | "this_year";

/**
 * Deterministically resolves date boundaries for personal money dashboard queries.
 * Always produces a valid date range <= 366 days to respect the backend constraints.
 */
export function resolvePersonalPeriodRange(
  period: PersonalMoneyPeriod,
  refDate: Date = new Date(),
): { from: string; to: string; label: string } {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed

  if (period === "last_month") {
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    const mm = String(prevMonth).padStart(2, "0");
    const dd = String(lastDay).padStart(2, "0");
    return {
      from: `${prevYear}-${mm}-01`,
      to: `${prevYear}-${mm}-${dd}`,
      label: "Last Month",
    };
  }

  if (period === "this_year") {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
      label: `Year ${year}`,
    };
  }

  // Default: this_month
  const currentMonth = month + 1;
  const lastDay = new Date(year, currentMonth, 0).getDate();
  const mm = String(currentMonth).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${dd}`,
    label: "This Month",
  };
}

/**
 * Calculates a percentage integer safely using BigInt arithmetic.
 * Never introduces floating-point precision loss before final rounded display.
 */
export function calculatePercentage(
  itemMinorUnits: string | bigint | number | null | undefined,
  totalMinorUnits: string | bigint | number | null | undefined,
): number {
  try {
    const item =
      typeof itemMinorUnits === "bigint"
        ? itemMinorUnits
        : BigInt(itemMinorUnits ? String(itemMinorUnits).split(".")[0] : "0");
    const total =
      typeof totalMinorUnits === "bigint"
        ? totalMinorUnits
        : BigInt(totalMinorUnits ? String(totalMinorUnits).split(".")[0] : "0");

    if (total <= 0n || item <= 0n) return 0;
    // Basis points: (item * 10000) / total
    const basisPoints = Number((item * 10000n) / total);
    return Math.min(100, Math.max(0, Math.round(basisPoints / 100)));
  } catch {
    return 0;
  }
}

/**
 * Aggregates category items safely using BigInt arithmetic.
 */
export function aggregateCategoryBreakdown(
  items: Array<{
    categoryId?: string | null;
    categoryName?: string | null;
    amountMinorUnits: string | number | null | undefined;
    color?: string | null;
  }>,
  totalMinorUnits: string | bigint | number | null | undefined,
): SharedCategoryItem[] {
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      total: bigint;
      color?: string | null;
      count: number;
    }
  >();

  for (const item of items) {
    const name = item.categoryName?.trim() || "Uncategorized";
    const id = item.categoryId?.trim() || name;
    let amount = 0n;
    try {
      amount = BigInt(
        item.amountMinorUnits
          ? String(item.amountMinorUnits).split(".")[0]
          : "0",
      );
    } catch {
      amount = 0n;
    }
    if (amount <= 0n) continue;

    const existing = map.get(id);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      map.set(id, {
        id,
        name,
        total: amount,
        color: item.color ?? null,
        count: 1,
      });
    }
  }

  const results: SharedCategoryItem[] = Array.from(map.values())
    .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      amountMinorUnits: entry.total.toString(),
      color: entry.color,
      percentage: calculatePercentage(entry.total, totalMinorUnits),
      count: entry.count,
    }));

  return results;
}

/**
 * Builds weekly cashflow points for a given date range.
 */
export function buildCashflowBuckets(
  incomes: Array<{ date: string; amountMinorUnits: string | number }>,
  expenses: Array<{ date: string; amountMinorUnits: string | number }>,
  period: PersonalMoneyPeriod,
  _refDate: Date = new Date(),
): SharedCashFlowPoint[] {
  if (period === "this_year") {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const buckets: SharedCashFlowPoint[] = months.map((label) => ({
      label,
      incomeMinorUnits: 0,
      expenseMinorUnits: 0,
    }));

    for (const inc of incomes) {
      const d = new Date(inc.date);
      if (!Number.isNaN(d.getTime())) {
        const m = d.getMonth();
        const amt = Number(inc.amountMinorUnits) || 0;
        if (buckets[m]) {
          buckets[m].incomeMinorUnits =
            Number(buckets[m].incomeMinorUnits) + amt;
        }
      }
    }

    for (const exp of expenses) {
      const d = new Date(exp.date);
      if (!Number.isNaN(d.getTime())) {
        const m = d.getMonth();
        const amt = Number(exp.amountMinorUnits) || 0;
        if (buckets[m]) {
          buckets[m].expenseMinorUnits =
            Number(buckets[m].expenseMinorUnits) + amt;
        }
      }
    }

    return buckets;
  }

  // Monthly: 4 weeks
  const buckets: SharedCashFlowPoint[] = [
    { label: "Week 1", incomeMinorUnits: 0, expenseMinorUnits: 0 },
    { label: "Week 2", incomeMinorUnits: 0, expenseMinorUnits: 0 },
    { label: "Week 3", incomeMinorUnits: 0, expenseMinorUnits: 0 },
    { label: "Week 4", incomeMinorUnits: 0, expenseMinorUnits: 0 },
  ];

  for (const inc of incomes) {
    const d = new Date(inc.date);
    if (!Number.isNaN(d.getTime())) {
      const day = d.getDate();
      const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
      buckets[weekIndex].incomeMinorUnits =
        Number(buckets[weekIndex].incomeMinorUnits) +
        (Number(inc.amountMinorUnits) || 0);
    }
  }

  for (const exp of expenses) {
    const d = new Date(exp.date);
    if (!Number.isNaN(d.getTime())) {
      const day = d.getDate();
      const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
      buckets[weekIndex].expenseMinorUnits =
        Number(buckets[weekIndex].expenseMinorUnits) +
        (Number(exp.amountMinorUnits) || 0);
    }
  }

  return buckets;
}
