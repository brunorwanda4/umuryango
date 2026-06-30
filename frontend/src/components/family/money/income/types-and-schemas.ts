import { z } from "zod";

export const transactionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amountMinorUnits: z.coerce.number().min(1, "Amount must be greater than 0"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  receivedFrom: z.string().optional(),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  fileName: z.string().optional(), // Mock receipt upload filename
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

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

export type IncomeTransaction = {
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
  receipts?: Receipt[];
};
