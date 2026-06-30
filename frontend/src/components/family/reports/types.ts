import type { FamilyDetail } from "@/components/family/dashboard/types";

export type ReportPeriod = "month" | "quarter" | "year";
export type ReportTypeFilter =
  | "all"
  | "money"
  | "contributions"
  | "projects"
  | "savings"
  | "debts"
  | "budgets";

export type MoneyMinorValue = number | string;

export type ReportsOverview = {
  currency?: string;
  generatedAt?: string;
  sourceRecordCount?: number;
  period?: {
    label?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
  totals?: ReportTotals;
  trend?: ReportTrendPoint[];
  breakdown?: ReportBreakdownPoint[];
  reports?: GeneratedReportRow[];
  sourceRecords?: ReportSourceRecordRow[];
  exports?: ReportExportRow[];
};

export type ReportTotals = {
  cashBalanceMinorUnits?: MoneyMinorValue | null;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
  contributionsPaidMinorUnits?: MoneyMinorValue | null;
  savingsMinorUnits?: MoneyMinorValue | null;
  debtOutstandingMinorUnits?: MoneyMinorValue | null;
  projectPlannedMinorUnits?: MoneyMinorValue | null;
  reportCount?: number | null;
  exportCount?: number | null;
  pendingApprovalCount?: number | null;
};

export type ReportTrendPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
  contributionsPaidMinorUnits?: MoneyMinorValue | null;
};

export type ReportBreakdownPoint = {
  label: string;
  amountMinorUnits?: MoneyMinorValue | null;
};

export type GeneratedReportRow = {
  id: string;
  title: string;
  type: string;
  periodLabel?: string | null;
  generatedAt?: string | null;
  generatedBy?: string | null;
  status?: string | null;
  sourceRecordCount?: number | null;
};

export type ReportSourceRecordRow = {
  id: string;
  module: string;
  title: string;
  date?: string | null;
  status?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  createdBy?: string | null;
};

export type ReportExportRow = {
  id: string;
  title: string;
  format: string;
  status?: string | null;
  requestedAt?: string | null;
  requestedBy?: string | null;
};

export type MoneyOverview = {
  currency?: string;
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
  };
  cashFlow?: MoneyCashFlowPoint[];
  allocation?: ReportBreakdownPoint[];
  records?: MoneyRecordRow[];
};

export type MoneyCashFlowPoint = {
  label: string;
  incomeMinorUnits?: MoneyMinorValue | null;
  expenseMinorUnits?: MoneyMinorValue | null;
};

export type MoneyRecordRow = {
  id: string;
  type: string;
  title: string;
  date?: string | null;
  status?: string | null;
  amountMinorUnits?: MoneyMinorValue | null;
  createdBy?: string | null;
};

export type ContributionsOverview = {
  currency?: string;
  sourceRecordCount?: number;
  totals?: {
    collectedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    overdueMinorUnits?: MoneyMinorValue | null;
    collectionRatePercent?: number | null;
  };
};

export type ProjectsOverview = {
  currency?: string;
  sourceRecordCount?: number;
  totals?: {
    plannedMinorUnits?: MoneyMinorValue | null;
    contributedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    activeProjectCount?: number | null;
  };
};

export type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      reports: ReportsOverview | null;
      reportsMessage?: string;
      money: MoneyOverview | null;
      moneyMessage?: string;
      contributions: ContributionsOverview | null;
      contributionsMessage?: string;
      projects: ProjectsOverview | null;
      projectsMessage?: string;
    };
