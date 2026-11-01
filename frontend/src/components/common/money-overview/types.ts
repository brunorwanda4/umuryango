import type { ReactNode } from "react";

export type SharedMoneyPeriodOption = {
  value: string;
  label: string;
};

export type SharedCashFlowPoint = {
  label: string;
  incomeMinorUnits: string | number;
  expenseMinorUnits: string | number;
};

export type SharedCategoryItem = {
  id: string;
  name: string;
  amountMinorUnits: string;
  percentage: number; // 0-100
  color?: string | null;
  count?: number;
};

export type SharedTransactionItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  type: "income" | "expense" | "transfer" | "contribution";
  amountMinorUnits: string;
  currency: string;
  date: string;
  rawDate?: string;
  status: string;
  statusVariant?: "success" | "pending" | "danger" | "neutral";
  category?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  createdBy?: string | null;
  notes?: string | null;
  actions?: ReactNode;
};
