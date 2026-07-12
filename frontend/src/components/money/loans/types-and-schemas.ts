import { z } from "zod";
import type { FamilyContact } from "@/components/family/contacts/types-and-schemas";

export type PersonalLoanType = "BORROWED" | "LENT";
export type PersonalLoanStatus = "ACTIVE" | "REPAID" | "OVERDUE" | "CANCELLED";

export type LoanPerson = {
  id: string;
  name: string;
  relationship: string | null;
  phoneNumber: string | null;
};

export type PersonalLoan = {
  id: string;
  familyId: string;
  title: string;
  type: PersonalLoanType;
  person: LoanPerson;
  originalAmountMinorUnits: string;
  totalExpectedAmountMinorUnits: string;
  paidAmountMinorUnits: string;
  remainingBalanceMinorUnits: string;
  currency: string;
  startDate: string;
  dueDate: string;
  repaymentFrequency: string;
  interestRate: string;
  category: { id: string; name: string } | null;
  notes: string | null;
  status: PersonalLoanStatus;
  createdAt: string;
};

export type LoanPayment = {
  id: string;
  amountMinorUnits: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  createdByName: string | null;
};

export type LoanCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  status: "ACTIVE" | "INACTIVE";
};

export type PersonalLoanFilters = {
  search: string;
  status: "all" | PersonalLoanStatus;
  personId: "all" | string;
};

export const EMPTY_PERSONAL_LOAN_FILTERS: PersonalLoanFilters = {
  search: "",
  status: "all",
  personId: "all",
};

export const personalLoanFormSchema = z
  .object({
    title: z.string().trim().min(2, "Loan title is required").max(140),
    type: z.enum(["BORROWED", "LENT"]),
    personContactId: z.string().min(1, "Choose a person"),
    amountMinorUnits: z
      .number()
      .int()
      .positive("Amount must be greater than 0"),
    startDate: z.string().min(1, "Start date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    notes: z.string().trim().max(1000).optional(),
    repaymentFrequency: z.enum([
      "ONCE",
      "WEEKLY",
      "BIWEEKLY",
      "MONTHLY",
      "QUARTERLY",
      "YEARLY",
    ]),
    useInterest: z.boolean(),
    interestRate: z
      .string()
      .trim()
      .regex(/^\d{0,3}(\.\d{0,4})?$/, "Use a valid rate such as 5")
      .optional()
      .or(z.literal("")),
    categoryId: z.string().optional(),
  })
  .refine((values) => new Date(values.dueDate) > new Date(values.startDate), {
    message: "Due date must be after the start date",
    path: ["dueDate"],
  })
  .refine((values) => !values.useInterest || Number(values.interestRate) > 0, {
    message: "Enter an interest rate or turn interest off",
    path: ["interestRate"],
  });

export type PersonalLoanFormValues = z.infer<typeof personalLoanFormSchema>;

export const recordPaymentSchema = z.object({
  amountMinorUnits: z.number().int().positive("Payment must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum([
    "CASH",
    "MOBILE_MONEY",
    "BANK_TRANSFER",
    "CARD",
    "OTHER",
  ]),
  notes: z.string().trim().max(500).optional(),
  payFull: z.boolean(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

type BackendParty = {
  contactId?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  relationshipToFamily?: string | null;
};

type BackendLoan = {
  id: string;
  familyId: string;
  title: string;
  loanType: PersonalLoanType;
  borrower?: BackendParty | null;
  lender?: BackendParty | null;
  principalAmountMinorUnits: string;
  totalExpectedAmountMinorUnits: string;
  paidAmountMinorUnits: string;
  remainingBalanceMinorUnits: string;
  currency: string;
  startDate: string;
  dueDate: string;
  repaymentFrequency: string;
  interestRate?: string | null;
  category?: { id: string; name: string } | null;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "OVERDUE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

export function normalizePersonalLoans(value: unknown): PersonalLoan[] {
  const raw = Array.isArray(value)
    ? value
    : ((value as { items?: BackendLoan[] } | null)?.items ?? []);

  return raw.flatMap((loan) => {
    const person = loan.loanType === "BORROWED" ? loan.lender : loan.borrower;
    if (!person?.contactId || !person.name) return [];

    return [
      {
        id: loan.id,
        familyId: loan.familyId,
        title: loan.title,
        type: loan.loanType,
        person: {
          id: person.contactId,
          name: person.name,
          relationship: person.relationshipToFamily ?? null,
          phoneNumber: person.phoneNumber ?? null,
        },
        originalAmountMinorUnits: String(loan.principalAmountMinorUnits),
        totalExpectedAmountMinorUnits: String(
          loan.totalExpectedAmountMinorUnits,
        ),
        paidAmountMinorUnits: String(loan.paidAmountMinorUnits),
        remainingBalanceMinorUnits: String(loan.remainingBalanceMinorUnits),
        currency: loan.currency,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        repaymentFrequency: loan.repaymentFrequency,
        interestRate: loan.interestRate ?? "0",
        category: loan.category ?? null,
        notes: loan.description ?? null,
        status:
          loan.status === "COMPLETED"
            ? "REPAID"
            : loan.status === "OVERDUE"
              ? "OVERDUE"
              : loan.status === "CANCELLED"
                ? "CANCELLED"
                : "ACTIVE",
        createdAt: loan.createdAt,
      },
    ];
  });
}

const PERSONAL_CONTACT_TYPES = new Set([
  "RELATIVE",
  "FAMILY_FRIEND",
  "NEIGHBOR",
  "EMERGENCY_CONTACT",
  "LOAN_CONTACT",
  "OTHER",
]);

export function isTrustedPerson(contact: FamilyContact) {
  return (
    contact.status === "ACTIVE" &&
    !contact.organization &&
    PERSONAL_CONTACT_TYPES.has(contact.contactType)
  );
}

export function getLoanProgress(loan: PersonalLoan) {
  const original = BigInt(loan.totalExpectedAmountMinorUnits || "0");
  const paid = BigInt(loan.paidAmountMinorUnits || "0");
  if (original <= BigInt(0)) return 0;
  return Number((paid * BigInt(100)) / original);
}

export function getPersonRelationship(contact: FamilyContact) {
  return (
    contact.relationshipToFamily ||
    (contact.contactType === "FAMILY_FRIEND"
      ? "Friend"
      : contact.contactType === "RELATIVE"
        ? "Relative"
        : "Other")
  );
}
