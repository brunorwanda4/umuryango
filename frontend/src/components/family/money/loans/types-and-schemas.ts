import { z } from "zod";

export type LoanType = "MONEY_BORROWED" | "MONEY_LENT";

export type LoanStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "PARTIALLY_PAID"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type LoanApprovalStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type RepaymentFrequency =
  | "ONE_TIME"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export type LoanDocument = {
  id: string;
  fileName: string;
  fileType?: string | null;
  fileSizeBytes?: number | null;
  createdAt?: string | null;
};

export type LoanRepayment = {
  id: string;
  amountMinorUnits: string | number;
  paymentDate: string;
  paymentMethod: string;
  paidBy: string;
  receivedBy: string;
  notes?: string | null;
  receipt?: LoanDocument | null;
  createdAt?: string | null;
};

export type LoanAuditEntry = {
  id: string;
  action: string;
  actorName?: string | null;
  createdAt: string;
  note?: string | null;
};

export type LoanRecord = {
  id: string;
  familyId: string;
  title: string;
  type: LoanType;
  originalAmountMinorUnits: string | number;
  paidAmountMinorUnits: string | number;
  remainingBalanceMinorUnits: string | number;
  totalExpectedPaymentMinorUnits?: string | number | null;
  currency: string;
  interestRateBasisPoints?: number | null;
  startDate: string;
  dueDate: string;
  borrower: string;
  lender: string;
  category?: string | null;
  paymentMethod: string;
  repaymentFrequency: RepaymentFrequency;
  notes?: string | null;
  status: LoanStatus;
  approvalStatus: LoanApprovalStatus;
  createdBy?: { fullName: string } | null;
  createdByName?: string | null;
  approvedBy?: { fullName: string } | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  documents?: LoanDocument[];
  repayments?: LoanRepayment[];
  auditHistory?: LoanAuditEntry[];
  createdAt: string;
  updatedAt: string;
};

export type LoanFiltersState = {
  search: string;
  type: "all" | LoanType;
  status: "all" | LoanStatus;
  startDate: string;
  endDate: string;
  borrower: string;
  lender: string;
  dueStartDate: string;
  dueEndDate: string;
  overdueOnly: boolean;
  minAmount: string;
  maxAmount: string;
};

export const EMPTY_LOAN_FILTERS: LoanFiltersState = {
  search: "",
  type: "all",
  status: "all",
  startDate: "",
  endDate: "",
  borrower: "all",
  lender: "all",
  dueStartDate: "",
  dueEndDate: "",
  overdueOnly: false,
  minAmount: "",
  maxAmount: "",
};

export const loanTypes = [
  { label: "Money Borrowed", value: "MONEY_BORROWED" },
  { label: "Money Lent", value: "MONEY_LENT" },
] satisfies { label: string; value: LoanType }[];

export const repaymentFrequencies = [
  { label: "One-time", value: "ONE_TIME" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Yearly", value: "YEARLY" },
] satisfies { label: string; value: RepaymentFrequency }[];

export const loanStatuses = [
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
] satisfies { label: string; value: LoanStatus }[];

export const loanApprovalStatuses = [
  { label: "Not Required", value: "NOT_REQUIRED" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
] satisfies { label: string; value: LoanApprovalStatus }[];

export const paymentMethods = [
  { label: "Cash", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "Card", value: "CARD" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "SACCO Transfer", value: "SACCO_TRANSFER" },
  { label: "Other", value: "OTHER" },
];

export const loanFormSchema = z
  .object({
    title: z.string().min(1, "Loan title is required"),
    type: z.enum(["MONEY_BORROWED", "MONEY_LENT"]),
    amountMinorUnits: z.coerce.number().min(1, "Amount must be greater than 0"),
    interestRatePercent: z
      .string()
      .trim()
      .regex(/^\d{0,3}(\.\d{0,2})?$/, "Use a valid rate such as 12.5")
      .optional()
      .or(z.literal("")),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    borrower: z.string().min(1, "Borrower is required"),
    lender: z.string().min(1, "Lender is required"),
    category: z.string().optional(),
    paymentMethod: z.string().min(1, "Payment method is required"),
    repaymentFrequency: z.enum([
      "ONE_TIME",
      "WEEKLY",
      "MONTHLY",
      "QUARTERLY",
      "YEARLY",
    ]),
    notes: z.string().optional(),
    documentFileName: z.string().optional(),
    status: z.enum([
      "DRAFT",
      "PENDING_APPROVAL",
      "ACTIVE",
      "PARTIALLY_PAID",
      "COMPLETED",
      "OVERDUE",
      "CANCELLED",
    ]),
    approvalStatus: z.enum(["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"]),
  })
  .refine((values) => new Date(values.dueDate) >= new Date(values.startDate), {
    message: "Due date cannot be before start date",
    path: ["dueDate"],
  });

export type LoanFormValues = z.infer<typeof loanFormSchema>;

export const repaymentFormSchema = z.object({
  amountMinorUnits: z.coerce
    .number()
    .min(1, "Amount paid must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paidBy: z.string().min(1, "Paid by is required"),
  receivedBy: z.string().min(1, "Received by is required"),
  receiptFileName: z.string().optional(),
  notes: z.string().optional(),
  allowOverpayment: z.boolean().optional(),
});

export type RepaymentFormValues = z.infer<typeof repaymentFormSchema>;

export const documentFormSchema = z.object({
  fileName: z.string().optional(),
  notes: z.string().optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
