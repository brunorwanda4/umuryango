import { createTranslator } from "@/i18n/translate";

export type FamilyAuthority = "HEAD" | "ADMIN" | "MEMBER";

export type FamilyCapability =
  | "MANAGE_FAMILY_SETTINGS"
  | "MANAGE_MEMBERS"
  | "MANAGE_CONTACTS"
  | "MANAGE_SAVINGS"
  | "MANAGE_CONTRIBUTIONS"
  | "RECORD_INCOME"
  | "RECORD_EXPENSE"
  | "APPROVE_EXPENSE"
  | "MANAGE_DEBTS"
  | "MANAGE_PROJECTS"
  | "MANAGE_EVENTS"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_DOCUMENTS"
  | "VIEW_REPORTS"
  | "EXPORT_REPORTS";

export type FamilyKinship =
  | "SON"
  | "DAUGHTER"
  | "FATHER"
  | "MOTHER"
  | "BROTHER"
  | "SISTER"
  | "UNCLE"
  | "AUNT"
  | "GRANDFATHER"
  | "GRANDMOTHER"
  | "COUSIN"
  | "IN_LAW"
  | "FAMILY_FRIEND"
  | "NEIGHBOR"
  | "CLEANER"
  | "OTHER";

const tAuth = createTranslator("FamilyAccess.authorities");
const tKin = createTranslator("FamilyAccess.kinships");
const tCap = createTranslator("FamilyAccess.capabilities");

export const AUTHORITY_LABELS: Record<FamilyAuthority, string> = {
  HEAD: tAuth("HEAD"),
  ADMIN: tAuth("ADMIN"),
  MEMBER: tAuth("MEMBER"),
};

export const KINSHIP_LABELS: Record<FamilyKinship, string> = {
  SON: tKin("SON"),
  DAUGHTER: tKin("DAUGHTER"),
  FATHER: tKin("FATHER"),
  MOTHER: tKin("MOTHER"),
  BROTHER: tKin("BROTHER"),
  SISTER: tKin("SISTER"),
  UNCLE: tKin("UNCLE"),
  AUNT: tKin("AUNT"),
  GRANDFATHER: tKin("GRANDFATHER"),
  GRANDMOTHER: tKin("GRANDMOTHER"),
  COUSIN: tKin("COUSIN"),
  IN_LAW: tKin("IN_LAW"),
  FAMILY_FRIEND: tKin("FAMILY_FRIEND"),
  NEIGHBOR: tKin("NEIGHBOR"),
  CLEANER: tKin("CLEANER"),
  OTHER: tKin("OTHER"),
};

export const CAPABILITY_LABELS: Record<FamilyCapability, string> = {
  MANAGE_FAMILY_SETTINGS: tCap("MANAGE_FAMILY_SETTINGS"),
  MANAGE_MEMBERS: tCap("MANAGE_MEMBERS"),
  MANAGE_CONTACTS: tCap("MANAGE_CONTACTS"),
  MANAGE_SAVINGS: tCap("MANAGE_SAVINGS"),
  MANAGE_CONTRIBUTIONS: tCap("MANAGE_CONTRIBUTIONS"),
  RECORD_INCOME: tCap("RECORD_INCOME"),
  RECORD_EXPENSE: tCap("RECORD_EXPENSE"),
  APPROVE_EXPENSE: tCap("APPROVE_EXPENSE"),
  MANAGE_DEBTS: tCap("MANAGE_DEBTS"),
  MANAGE_PROJECTS: tCap("MANAGE_PROJECTS"),
  MANAGE_EVENTS: tCap("MANAGE_EVENTS"),
  MANAGE_ANNOUNCEMENTS: tCap("MANAGE_ANNOUNCEMENTS"),
  MANAGE_DOCUMENTS: tCap("MANAGE_DOCUMENTS"),
  VIEW_REPORTS: tCap("VIEW_REPORTS"),
  EXPORT_REPORTS: tCap("EXPORT_REPORTS"),
};

export const ALL_CAPABILITIES = Object.keys(
  CAPABILITY_LABELS,
) as FamilyCapability[];

export function hasCapability(
  source: {
    authority: FamilyAuthority;
    capabilities: FamilyCapability[];
  },
  capability: FamilyCapability,
): boolean {
  return (
    source.authority === "HEAD" || source.capabilities.includes(capability)
  );
}
