import { z } from "zod";
import type { MoneyBudgetRow } from "../types";

export const expenseSchema = z.object({
  title: z.string().min(1, "Expense title is required"),
  amountMinorUnits: z.coerce.number().min(1, "Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  paidTo: z.string().optional(),
  paidBy: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  budgetId: z.string().optional(),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  fileName: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export type Category = {
  id: string;
  name: string;
  type: string;
};

export type Receipt = {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  createdAt: string;
};

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";

export type ExpenseTransaction = {
  id: string;
  familyId: string;
  categoryId: string;
  amountMinorUnits: string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  status: ExpenseStatus;
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
  receipts?: Receipt[];
};

export type ProjectOption = {
  id: string;
  name: string;
  status?: string | null;
};

export type ExpenseLinkOptions = {
  budgets: MoneyBudgetRow[];
  projects: ProjectOption[];
};

export const paymentMethods = [
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Debit Card", value: "DEBIT_CARD" },
  { label: "Credit Card", value: "CREDIT_CARD" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Other", value: "OTHER" },
];

export const expenseStatuses = [
  { label: "Draft", value: "DRAFT" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];
