export type FamilyAuthority = "HEAD" | "ADMIN" | "MEMBER";

export type FamilyCapability =
  | "MANAGE_FAMILY_SETTINGS"
  | "MANAGE_MEMBERS"
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

export const AUTHORITY_LABELS: Record<FamilyAuthority, string> = {
  HEAD: "Head",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const KINSHIP_LABELS: Record<FamilyKinship, string> = {
  SON: "Son",
  DAUGHTER: "Daughter",
  FATHER: "Father",
  MOTHER: "Mother",
  BROTHER: "Brother",
  SISTER: "Sister",
  UNCLE: "Uncle",
  AUNT: "Aunt",
  GRANDFATHER: "Grandfather",
  GRANDMOTHER: "Grandmother",
  COUSIN: "Cousin",
  IN_LAW: "In-law",
  FAMILY_FRIEND: "Family friend",
  NEIGHBOR: "Neighbor",
  CLEANER: "Cleaner",
  OTHER: "Other",
};

export const CAPABILITY_LABELS: Record<FamilyCapability, string> = {
  MANAGE_FAMILY_SETTINGS: "Manage family settings",
  MANAGE_MEMBERS: "Manage members",
  MANAGE_SAVINGS: "Manage savings",
  MANAGE_CONTRIBUTIONS: "Manage contributions",
  RECORD_INCOME: "Record income",
  RECORD_EXPENSE: "Record expense",
  APPROVE_EXPENSE: "Approve expense",
  MANAGE_DEBTS: "Manage debts",
  MANAGE_PROJECTS: "Manage projects",
  MANAGE_EVENTS: "Manage events",
  MANAGE_ANNOUNCEMENTS: "Manage announcements",
  MANAGE_DOCUMENTS: "Manage documents",
  VIEW_REPORTS: "View reports",
  EXPORT_REPORTS: "Export reports",
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
