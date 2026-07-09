import { z } from "zod";

export const transactionSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    amountMinorUnits: z.coerce.number().min(0, "Amount cannot be negative"),
    categoryId: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    receivedFrom: z.string().optional(),
    receivedFromContactId: z.string().optional(),
    receivedBy: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().min(1, "Status is required"),
    fileName: z.string().optional(), // Mock receipt upload filename
    incomeRecurrence: z.enum(["ONE_TIME", "MONTHLY"]).default("ONE_TIME"),
    expectedAmountMinorUnits: z.coerce.number().optional(),
    dueDate: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    propertyName: z.string().optional(),
    isPaymentMode: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      values.incomeRecurrence === "ONE_TIME" &&
      values.amountMinorUnits <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Amount must be greater than 0",
        path: ["amountMinorUnits"],
      });
    }

    if (values.incomeRecurrence === "MONTHLY") {
      if (values.isPaymentMode && values.amountMinorUnits <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Payment amount must be greater than 0",
          path: ["amountMinorUnits"],
        });
      }

      if (
        !values.expectedAmountMinorUnits ||
        values.expectedAmountMinorUnits <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Expected monthly amount is required",
          path: ["expectedAmountMinorUnits"],
        });
      }

      if (!values.dueDate) {
        ctx.addIssue({
          code: "custom",
          message: "Due date is required",
          path: ["dueDate"],
        });
      }
    }
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
  incomeRecurrence: "ONE_TIME" | "MONTHLY";
  paymentStatus: "NOT_EXPECTED" | "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
  date: string;
  description: string | null;
  paymentMethod: string | null;
  notes: string | null;
  receivedFrom: string | null;
  receivedFromContactId: string | null;
  receivedFromContact?: {
    id: string;
    fullName: string;
    phoneNumber: string | null;
  } | null;
  receivedBy: string | null;
  expectedAmountMinorUnits: string | null;
  dueDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  propertyName: string | null;
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
