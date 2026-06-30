import type { FamilyDetail } from "@/components/family/dashboard/types";

export type MoneyPeriod = "month" | "quarter" | "year";

export type MoneyMinorValue = number | string;

export type MoneyOverview = {
  currency?: string;
  period?: {
    label?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    cashBalanceMinorUnits?: MoneyMinorValue | null;
    incomeMinorUnits?: MoneyMinorValue | null;
    expenseMinorUnits?: MoneyMinorValue | null;
    contributionsPaidMinorUnits?: MoneyMinorValue | null;
    savingsMinorUnits?: MoneyMinorValue | null;
    debtOutstandingMinorUnits?: MoneyMinorValue | null;
    pendingApprovalCount?: number | null;
    overdueCount?: number | null;
  };
  cashFlow?: MoneyCashFlowPoint[];
  allocation?: MoneyAllocationPoint[];
  budgets?: MoneyBudgetRow[];
  approvals?: MoneyApprovalRow[];
  records?: MoneyRecordRow[];
};

export type MoneyCashFlowPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
};

export type MoneyAllocationPoint = {
  label: string;
  amountMinorUnits?: MoneyMinorValue | null;
};

export type MoneyBudgetRow = {
  id?: string;
  categoryName: string;
  spentMinorUnits?: MoneyMinorValue | null;
  limitMinorUnits?: MoneyMinorValue | null;
  percentUsed?: number | null;
  status?: string | null;
};

export type MoneyApprovalRow = {
  id: string;
  type: string;
  title: string;
  amountMinorUnits?: MoneyMinorValue | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  status?: string | null;
};

export type MoneyRecordRow = {
  id: string;
  type: string;
  title: string;
  category?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  date?: string | null;
  status?: string | null;
  createdBy?: string | null;
};

export type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      money: MoneyOverview | null;
      moneyMessage?: string;
    };
