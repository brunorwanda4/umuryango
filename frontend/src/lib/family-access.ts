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
  HEAD: tAuth((m) => m.FamilyAccess.authorities.HEAD),
  ADMIN: tAuth((m) => m.FamilyAccess.authorities.ADMIN),
  MEMBER: tAuth((m) => m.FamilyAccess.authorities.MEMBER),
};

export const KINSHIP_LABELS: Record<FamilyKinship, string> = {
  SON: tKin((m) => m.FamilyAccess.kinships.SON),
  DAUGHTER: tKin((m) => m.FamilyAccess.kinships.DAUGHTER),
  FATHER: tKin((m) => m.FamilyAccess.kinships.FATHER),
  MOTHER: tKin((m) => m.FamilyAccess.kinships.MOTHER),
  BROTHER: tKin((m) => m.FamilyAccess.kinships.BROTHER),
  SISTER: tKin((m) => m.FamilyAccess.kinships.SISTER),
  UNCLE: tKin((m) => m.FamilyAccess.kinships.UNCLE),
  AUNT: tKin((m) => m.FamilyAccess.kinships.AUNT),
  GRANDFATHER: tKin((m) => m.FamilyAccess.kinships.GRANDFATHER),
  GRANDMOTHER: tKin((m) => m.FamilyAccess.kinships.GRANDMOTHER),
  COUSIN: tKin((m) => m.FamilyAccess.kinships.COUSIN),
  IN_LAW: tKin((m) => m.FamilyAccess.kinships.IN_LAW),
  FAMILY_FRIEND: tKin((m) => m.FamilyAccess.kinships.FAMILY_FRIEND),
  NEIGHBOR: tKin((m) => m.FamilyAccess.kinships.NEIGHBOR),
  CLEANER: tKin((m) => m.FamilyAccess.kinships.CLEANER),
  OTHER: tKin((m) => m.FamilyAccess.kinships.OTHER),
};

export const CAPABILITY_LABELS: Record<FamilyCapability, string> = {
  MANAGE_FAMILY_SETTINGS: tCap(
    (m) => m.FamilyAccess.capabilities.MANAGE_FAMILY_SETTINGS,
  ),
  MANAGE_MEMBERS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_MEMBERS),
  MANAGE_CONTACTS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_CONTACTS),
  MANAGE_SAVINGS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_SAVINGS),
  MANAGE_CONTRIBUTIONS: tCap(
    (m) => m.FamilyAccess.capabilities.MANAGE_CONTRIBUTIONS,
  ),
  RECORD_INCOME: tCap((m) => m.FamilyAccess.capabilities.RECORD_INCOME),
  RECORD_EXPENSE: tCap((m) => m.FamilyAccess.capabilities.RECORD_EXPENSE),
  APPROVE_EXPENSE: tCap((m) => m.FamilyAccess.capabilities.APPROVE_EXPENSE),
  MANAGE_DEBTS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_DEBTS),
  MANAGE_PROJECTS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_PROJECTS),
  MANAGE_EVENTS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_EVENTS),
  MANAGE_ANNOUNCEMENTS: tCap(
    (m) => m.FamilyAccess.capabilities.MANAGE_ANNOUNCEMENTS,
  ),
  MANAGE_DOCUMENTS: tCap((m) => m.FamilyAccess.capabilities.MANAGE_DOCUMENTS),
  VIEW_REPORTS: tCap((m) => m.FamilyAccess.capabilities.VIEW_REPORTS),
  EXPORT_REPORTS: tCap((m) => m.FamilyAccess.capabilities.EXPORT_REPORTS),
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
