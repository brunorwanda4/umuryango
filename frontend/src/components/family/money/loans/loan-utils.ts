import type {
  LoanFiltersState,
  LoanRecord,
  LoanStatus,
} from "./types-and-schemas";

export function normalizeLoanRecords(loans: LoanRecord[] | undefined) {
  return Array.isArray(loans) ? loans : [];
}

export function isLoanOverdue(loan: LoanRecord, today = new Date()) {
  if (loan.status === "COMPLETED" || loan.status === "CANCELLED") {
    return false;
  }

  const dueDate = new Date(loan.dueDate);

  return (
    loan.status === "OVERDUE" ||
    (!Number.isNaN(dueDate.getTime()) && dueDate < startOfDay(today))
  );
}

export function isLoanDueThisMonth(loan: LoanRecord, today = new Date()) {
  const dueDate = new Date(loan.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return (
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    loan.status !== "COMPLETED" &&
    loan.status !== "CANCELLED"
  );
}

export function loanStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function loanTypeLabel(type: string) {
  return type === "MONEY_BORROWED" ? "Money Borrowed" : "Money Lent";
}

export function repaymentFrequencyLabel(value: string) {
  return loanStatusLabel(value).replace("One Time", "One-time");
}

export function formatPaymentMethod(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return loanStatusLabel(value).replace("Sacco", "SACCO");
}

export function formatInterestRate(basisPoints: number | null | undefined) {
  if (basisPoints === null || basisPoints === undefined) {
    return "No interest";
  }

  const whole = Math.trunc(basisPoints / 100);
  const fraction = String(Math.abs(basisPoints % 100)).padStart(2, "0");

  return `${whole}.${fraction}%`;
}

export function percentToBasisPoints(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) return 0;

  const [whole = "0", fraction = ""] = normalized.split(".");
  const basisPoints = `${whole}${fraction.padEnd(2, "0").slice(0, 2)}`;

  return Number.parseInt(basisPoints, 10) || 0;
}

export function basisPointsToPercentInput(value: number | null | undefined) {
  if (!value) return "";

  const whole = Math.trunc(value / 100);
  const fraction = String(Math.abs(value % 100)).padStart(2, "0");

  return `${whole}.${fraction}`.replace(/\.00$/, "");
}

export function toMinorNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value);
  }

  return 0;
}

export function getLoanProgress(loan: LoanRecord) {
  const original = toMinorNumber(loan.originalAmountMinorUnits);

  if (original <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((toMinorNumber(loan.paidAmountMinorUnits) / original) * 100),
    ),
  );
}

export function getEffectiveLoanStatus(loan: LoanRecord): LoanStatus {
  if (loan.status === "COMPLETED" || loan.status === "CANCELLED") {
    return loan.status;
  }

  if (toMinorNumber(loan.remainingBalanceMinorUnits) <= 0) {
    return "COMPLETED";
  }

  if (isLoanOverdue(loan)) {
    return "OVERDUE";
  }

  if (toMinorNumber(loan.paidAmountMinorUnits) > 0) {
    return "PARTIALLY_PAID";
  }

  return loan.status;
}

export function filterLoans(loans: LoanRecord[], filters: LoanFiltersState) {
  const minAmount = filters.minAmount
    ? Number(filters.minAmount.replace(/,/g, ""))
    : null;
  const maxAmount = filters.maxAmount
    ? Number(filters.maxAmount.replace(/,/g, ""))
    : null;

  return loans.filter((loan) => {
    const searchText = [
      loan.title,
      loan.borrower,
      loan.lender,
      loan.category,
      loan.notes,
      loan.status,
      loan.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const searchMatch =
      !filters.search || searchText.includes(filters.search.toLowerCase());
    const typeMatch = filters.type === "all" || loan.type === filters.type;
    const statusMatch =
      filters.status === "all" ||
      getEffectiveLoanStatus(loan) === filters.status;
    const borrowerMatch =
      filters.borrower === "all" || loan.borrower === filters.borrower;
    const lenderMatch =
      filters.lender === "all" || loan.lender === filters.lender;
    const overdueMatch = !filters.overdueOnly || isLoanOverdue(loan);
    const amount = toMinorNumber(loan.originalAmountMinorUnits);
    const amountMatch =
      (minAmount === null || Number.isNaN(minAmount) || amount >= minAmount) &&
      (maxAmount === null || Number.isNaN(maxAmount) || amount <= maxAmount);

    return (
      searchMatch &&
      typeMatch &&
      statusMatch &&
      borrowerMatch &&
      lenderMatch &&
      overdueMatch &&
      amountMatch &&
      matchesDateRange(loan.startDate, filters.startDate, filters.endDate) &&
      matchesDateRange(loan.dueDate, filters.dueStartDate, filters.dueEndDate)
    );
  });
}

export function getLoanParties(
  loans: LoanRecord[],
  key: "borrower" | "lender",
) {
  return Array.from(
    new Set(loans.map((loan) => loan[key]).filter(Boolean)),
  ).sort();
}

function matchesDateRange(value: string, startDate: string, endDate: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  if (startDate && date < new Date(startDate)) {
    return false;
  }

  if (endDate) {
    const endLimit = new Date(endDate);
    endLimit.setDate(endLimit.getDate() + 1);

    if (date >= endLimit) {
      return false;
    }
  }

  return true;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
