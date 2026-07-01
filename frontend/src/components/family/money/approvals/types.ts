export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "DRAFT"
  | "REVERSED";

export type ApprovalPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type ApprovalType =
  | "INCOME"
  | "EXPENSE"
  | "BUDGET"
  | "CONTRIBUTION"
  | "TRANSACTION"
  | "OTHER";

export type MoneyTransaction = {
  id: string;
  familyId: string;
  categoryId: string;
  amountMinorUnits: string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";
  date: string;
  description: string | null;
  paymentMethod: string | null;
  notes: string | null;
  receivedFrom: string | null;
  receivedBy: string | null;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  reversedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { name: string };
  createdBy: { fullName: string };
  approvedBy?: { fullName: string } | null;
};

export type ApprovalQueueItem = {
  id: string;
  source: "transaction" | "overview";
  type: ApprovalType;
  title: string;
  category: string;
  amountMinorUnits: string | null;
  requestedById: string | null;
  requestedBy: string;
  submittedAt: string | null;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  description: string;
  paymentMethod: string;
  receipt: string;
  budget: string;
  relatedProject: string;
  currentApprover: string;
  previousApprovers: string[];
  transaction?: MoneyTransaction;
};

export type ApprovalFilters = {
  search: string;
  type: string;
  status: string;
  category: string;
  requestedBy: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  priority: string;
};

export type ApprovalAnalyticsModel = {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  approvedThisMonthMinorUnits: string;
  averageApprovalHours: number | null;
  myPendingReviews: number;
  approvalPercent: number;
  statusComparison: { label: string; count: number; fill: string }[];
  approvalRate: { label: string; count: number; fill: string }[];
  approvalsByMonth: { label: string; count: number }[];
  approvalTimeByMonth: { label: string; averageHours: number }[];
  approvalsByCategory: { label: string; amount: number }[];
  rejectionsByCategory: { label: string; count: number }[];
};
