import { z } from "zod";
import { createTranslator } from "@/i18n/translate";

const t = createTranslator("FamilyContacts");

export type FamilyContactType =
  | "RELATIVE"
  | "FAMILY_FRIEND"
  | "NEIGHBOR"
  | "EMERGENCY_CONTACT"
  | "DOCTOR"
  | "LAWYER"
  | "SCHOOL"
  | "CHURCH"
  | "BANK"
  | "SACCO"
  | "BUSINESS_PARTNER"
  | "LOAN_CONTACT"
  | "OTHER";

export type FamilyContactStatus = "ACTIVE" | "INACTIVE";

export type FamilyContact = {
  id: string;
  familyId: string;
  fullName: string;
  contactType: FamilyContactType;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  relationshipToFamily?: string | null;
  organization?: string | null;
  notes?: string | null;
  isEmergencyContact: boolean;
  isLoanContact: boolean;
  status: FamilyContactStatus;
  createdById: string;
  createdByName?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactListResponse = {
  items: FamilyContact[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContactFiltersState = {
  search: string;
  contactType: "all" | FamilyContactType;
  status: "all" | FamilyContactStatus;
  emergencyOnly: boolean;
  loanOnly: boolean;
};

export const EMPTY_CONTACT_FILTERS: ContactFiltersState = {
  search: "",
  contactType: "all",
  status: "all",
  emergencyOnly: false,
  loanOnly: false,
};

export const contactTypeOptions = [
  { label: "Relative", value: "RELATIVE" },
  { label: "Family Friend", value: "FAMILY_FRIEND" },
  { label: "Neighbor", value: "NEIGHBOR" },
  { label: "Emergency Contact", value: "EMERGENCY_CONTACT" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Lawyer", value: "LAWYER" },
  { label: "School", value: "SCHOOL" },
  { label: "Church", value: "CHURCH" },
  { label: "Bank", value: "BANK" },
  { label: "SACCO", value: "SACCO" },
  { label: "Business Partner", value: "BUSINESS_PARTNER" },
  { label: "Loan Contact", value: "LOAN_CONTACT" },
  { label: "Other", value: "OTHER" },
] satisfies { label: string; value: FamilyContactType }[];

export const contactStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
] satisfies { label: string; value: FamilyContactStatus }[];

export const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  contactType: z.enum([
    "RELATIVE",
    "FAMILY_FRIEND",
    "NEIGHBOR",
    "EMERGENCY_CONTACT",
    "DOCTOR",
    "LAWYER",
    "SCHOOL",
    "CHURCH",
    "BANK",
    "SACCO",
    "BUSINESS_PARTNER",
    "LOAN_CONTACT",
    "OTHER",
  ]),
  phoneNumber: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email("Use a valid email address")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional(),
  relationshipToFamily: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isEmergencyContact: z.boolean().optional(),
  isLoanContact: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export function contactTypeLabel(type: string) {
  const key = `types.${type}`;
  const translated = t(key);
  if (translated !== `FamilyContacts.${key}`) return translated;
  return (
    contactTypeOptions.find((option) => option.value === type)?.label ??
    type.replace(/_/g, " ")
  );
}
