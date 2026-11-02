import type {
  SharedLoan,
  SharedLoanFiltersState,
  SharedLoanSummary,
} from "./types";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function calculateLoanSummary(
  loans: SharedLoan[],
  currency: string,
): SharedLoanSummary {
  let totalLentRemaining = BigInt(0);
  let totalBorrowedRemaining = BigInt(0);
  let totalLentOriginal = BigInt(0);
  let totalBorrowedOriginal = BigInt(0);
  let lentCount = 0;
  let borrowedCount = 0;
  let activeCount = 0;
  let overdueCount = 0;

  for (const loan of loans) {
    const isSettled =
      loan.status === "COMPLETED" ||
      loan.status === "REPAID" ||
      loan.status === "CANCELLED";
    const isActive = !isSettled;

    const remaining = BigInt(loan.remainingAmountMinorUnits || "0");
    const original = BigInt(loan.originalAmountMinorUnits || "0");

    if (loan.direction === "LENT") {
      totalLentRemaining += remaining;
      totalLentOriginal += original;
      if (isActive) lentCount += 1;
    } else {
      totalBorrowedRemaining += remaining;
      totalBorrowedOriginal += original;
      if (isActive) borrowedCount += 1;
    }

    if (isActive) activeCount += 1;
    if (loan.isOverdue && !isSettled) overdueCount += 1;
  }

  const netBalance = totalLentRemaining - totalBorrowedRemaining;
  const totalExposure = totalLentRemaining + totalBorrowedRemaining;

  let lentRatioPercent = 50;
  let borrowedRatioPercent = 50;

  if (totalExposure > BigInt(0)) {
    lentRatioPercent = Number(
      (totalLentRemaining * BigInt(100)) / totalExposure,
    );
    borrowedRatioPercent = 100 - lentRatioPercent;
  }

  return {
    currency,
    netBalanceMinorUnits: netBalance,
    totalLentRemainingMinorUnits: totalLentRemaining,
    totalBorrowedRemainingMinorUnits: totalBorrowedRemaining,
    totalLentOriginalMinorUnits: totalLentOriginal,
    totalBorrowedOriginalMinorUnits: totalBorrowedOriginal,
    lentCount,
    borrowedCount,
    activeCount,
    overdueCount,
    lentRatioPercent,
    borrowedRatioPercent,
  };
}

export function formatDueTimeline(
  dueDateString: string | null | undefined,
  isSettled = false,
  referenceDate = new Date(),
): { label: string; isOverdue: boolean } {
  if (!dueDateString) {
    return { label: "No due date", isOverdue: false };
  }

  const due = new Date(dueDateString);
  if (Number.isNaN(due.getTime())) {
    return { label: "Invalid date", isOverdue: false };
  }

  if (isSettled) {
    const dateFormatted = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(due);
    return { label: `Settled (${dateFormatted})`, isOverdue: false };
  }

  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffMs = startOfDue.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const shortDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(due);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label:
        overdueDays === 1
          ? "Overdue by 1 day"
          : `Overdue by ${overdueDays} days`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { label: "Due today", isOverdue: false };
  }

  if (diffDays <= 30) {
    return {
      label:
        diffDays === 1
          ? `Due tomorrow (${shortDate})`
          : `Due in ${diffDays} days (${shortDate})`,
      isOverdue: false,
    };
  }

  const fullDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(due);

  return { label: `Due ${fullDate}`, isOverdue: false };
}

export function filterSharedLoans(
  loans: SharedLoan[],
  filters: SharedLoanFiltersState,
): SharedLoan[] {
  const query = filters.search.trim().toLowerCase();

  return loans.filter((loan) => {
    // 1. Direction filter
    if (filters.direction !== "all" && loan.direction !== filters.direction) {
      return false;
    }

    // 2. Status filter
    if (filters.status !== "all") {
      if (filters.status === "ACTIVE") {
        if (
          loan.status === "COMPLETED" ||
          loan.status === "REPAID" ||
          loan.status === "CANCELLED" ||
          loan.isOverdue
        ) {
          return false;
        }
      } else if (filters.status === "OVERDUE") {
        if (!loan.isOverdue) return false;
      } else if (filters.status === "REPAID") {
        if (loan.status !== "COMPLETED" && loan.status !== "REPAID") {
          return false;
        }
      }
    }

    // 3. Counterparty filter
    if (
      filters.counterpartyId !== "all" &&
      loan.counterpartyContactId !== filters.counterpartyId &&
      loan.counterpartyName !== filters.counterpartyId
    ) {
      return false;
    }

    // 4. Search query
    if (query) {
      const match =
        loan.title.toLowerCase().includes(query) ||
        loan.counterpartyName.toLowerCase().includes(query) ||
        (loan.counterpartySubtitle?.toLowerCase().includes(query) ?? false) ||
        (loan.categoryName?.toLowerCase().includes(query) ?? false) ||
        (loan.notes?.toLowerCase().includes(query) ?? false);

      if (!match) return false;
    }

    return true;
  });
}
