import type { ComponentType } from "react";

export type SharedLoanDirection = "LENT" | "BORROWED";

export type SharedLoanStatus =
  | "ACTIVE"
  | "OVERDUE"
  | "REPAID"
  | "COMPLETED"
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PARTIALLY_PAID"
  | "CANCELLED";

export type SharedLoanAction = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive";
};

export type SharedLoan = {
  id: string;
  title: string;
  direction: SharedLoanDirection;
  counterpartyName: string;
  counterpartySubtitle?: string | null;
  counterpartyInitials: string;
  counterpartyContactId?: string | null;
  originalAmountMinorUnits: string;
  paidAmountMinorUnits: string;
  remainingAmountMinorUnits: string;
  currency: string;
  dueDate: string;
  startDate?: string;
  status: SharedLoanStatus;
  statusLabel: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  progressPercent: number;
  isOverdue: boolean;
  dueLabel?: string;
  categoryName?: string | null;
  notes?: string | null;
  primaryAction?: SharedLoanAction;
  menuActions?: SharedLoanAction[];
  onCardClick?: () => void;
};

export type SharedLoanSummary = {
  currency: string;
  netBalanceMinorUnits: bigint;
  totalLentRemainingMinorUnits: bigint;
  totalBorrowedRemainingMinorUnits: bigint;
  totalLentOriginalMinorUnits: bigint;
  totalBorrowedOriginalMinorUnits: bigint;
  lentCount: number;
  borrowedCount: number;
  activeCount: number;
  overdueCount: number;
  lentRatioPercent: number;
  borrowedRatioPercent: number;
};

export type SharedLoanFiltersState = {
  search: string;
  direction: "all" | "LENT" | "BORROWED";
  status: "all" | "ACTIVE" | "OVERDUE" | "REPAID";
  counterpartyId: "all" | string;
};

export const EMPTY_SHARED_LOAN_FILTERS: SharedLoanFiltersState = {
  search: "",
  direction: "all",
  status: "all",
  counterpartyId: "all",
};
