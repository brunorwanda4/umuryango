import type * as React from "react";
import type { Badge } from "@/components/ui/badge";

export type MoneyRecordType =
  | "income"
  | "expense"
  | "saving"
  | "debt"
  | "repayment";

export type MoneyDirection = "in" | "out";

export type MoneyStatus =
  | "received"
  | "paid"
  | "planned"
  | "active"
  | "overdue"
  | "settled";

export type DebtKind = "borrowed" | "lent";

export type MoneyBadgeVariant = React.ComponentProps<typeof Badge>["variant"];

export interface MoneyActivity {
  id: string;
  title: string;
  type: MoneyRecordType;
  category: string;
  amountMinorUnits: number;
  direction: MoneyDirection;
  date: string;
  account: string;
  status: MoneyStatus;
  description?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  savedMinorUnits: number;
  targetMinorUnits: number;
  dueDate: string;
  status: MoneyStatus;
}

export interface DebtRecord {
  id: string;
  title: string;
  party: string;
  kind: DebtKind;
  principalMinorUnits: number;
  outstandingMinorUnits: number;
  dueDate: string;
  status: MoneyStatus;
}

export interface MoneySummary {
  totalIncomeMinorUnits: number;
  totalExpensesMinorUnits: number;
  balanceMinorUnits: number;
  savingsMinorUnits: number;
  debtsMinorUnits: number;
}
