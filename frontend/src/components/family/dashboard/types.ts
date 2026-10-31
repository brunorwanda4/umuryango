import type { LucideIcon } from "lucide-react";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import type { MoneyOverview } from "@/components/family/money/types";
import type { ProjectsOverview } from "@/components/family/projects/types";
import type {
  FamilyAuthority,
  FamilyCapability,
  FamilyKinship,
} from "@/lib/family-access";

export type { FamilyAuthority, FamilyCapability, FamilyKinship };

export type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  joinedAt: string;
};

export type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  type?: string;
  description: string | null;
  createdAt: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  currentMember?: FamilyMemberSummary;
  memberCount: number;
  members: FamilyMemberSummary[];
};

export type DashboardModule = {
  title: string;
  description: string;
  helperText: string;
  segment: string;
  icon: LucideIcon;
  requiredCapabilities?: FamilyCapability[];
};

export type ContributionPlanRow = {
  id: string;
  name: string;
  cadence: string;
  amountMinorUnits: string;
  collectedMinorUnits: string;
  expectedMinorUnits: string;
  contributorCount: number;
  status: string;
};

export type ContributionCycleRow = {
  id: string;
  label: string;
  dueDate: string;
  collectedMinorUnits: string;
  expectedMinorUnits: string;
  percentCollected: number;
  status: string;
};

export type ContributionMemberRow = {
  id: string;
  fullName: string;
  expectedMinorUnits: string;
  paidMinorUnits: string;
  outstandingMinorUnits: string;
  lastPaymentDate: string | null;
  status: string;
};

export type ContributionPaymentRow = {
  id: string;
  contributor: string;
  planName: string;
  method: string;
  amountMinorUnits: string;
  date: string;
  status: string;
};

export type ContributionsOverview = {
  currency?: string;
  period?: {
    label?: string;
    startDate?: string;
    endDate?: string;
  };
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    expectedMinorUnits?: string | number | null;
    collectedMinorUnits?: string | number | null;
    outstandingMinorUnits?: string | number | null;
    overdueMinorUnits?: string | number | null;
    collectionRatePercent?: number | null;
    contributorsPaid?: number | null;
    contributorsExpected?: number | null;
    activePlanCount?: number | null;
    pendingVerificationCount?: number | null;
    overdueContributorCount?: number | null;
  };
  plans?: ContributionPlanRow[];
  cycles?: ContributionCycleRow[];
  members?: ContributionMemberRow[];
  payments?: ContributionPaymentRow[];
};

export type RejectedTransactionRow = {
  id: string;
  type?: string;
  status?: string;
  description?: string | null;
  amountMinorUnits?: string | number | null;
  currency?: string;
  date?: string;
  createdById?: string;
  createdBy?: { id?: string; fullName?: string } | null;
  category?: { name?: string } | null;
};

export type FamilyAuditAction =
  | "MEMBER_INVITED"
  | "INVITE_ACCEPTED"
  | "MEMBER_UPDATED"
  | "MEMBER_REMOVED"
  | "HEAD_GRANTED"
  | "FAMILY_SETTINGS_UPDATED";

export type FamilyAuditEvent = {
  id: string;
  action: FamilyAuditAction;
  actorId: string;
  targetMemberId: string | null;
  createdAt: string;
};

export type FamilyQuickActionId =
  | "add-income"
  | "add-expense"
  | "add-loan"
  | "create-project"
  | "invite-member"
  | "review-approvals"
  | "open-reports";

export type FamilyQuickActionItem = {
  id: FamilyQuickActionId;
  capability: FamilyCapability;
  href: string;
};

export type FamilyLoanSummary = {
  borrowedMinorUnits: bigint;
  lentMinorUnits: bigint;
  remainingMinorUnits: bigint;
  overdueCount: number;
  dueSoonCount: number;
  activeCount: number;
  urgentLoans: LoanRecord[];
};

export type FamilyAttentionKind =
  | "pending-approval"
  | "overdue-record"
  | "rejected-record"
  | "awaiting-verification";

export type FamilyAttentionItem = {
  id: string;
  kind: FamilyAttentionKind;
  title: string;
  subtitle: string;
  date: string;
  amountMinorUnits: string | number;
  currency: string;
  href?: string;
};

export type FamilyActivityKind =
  | "member-joined"
  | "member-invited"
  | "member-updated"
  | "transaction-income"
  | "transaction-expense"
  | "transaction-approved"
  | "transaction-rejected"
  | "contribution"
  | "project"
  | "settings";

export type FamilyActivityEntry = {
  id: string;
  kind: FamilyActivityKind;
  title: string;
  detail: string;
  occurredAt: string;
  href?: string;
};

export type FamilyDashboardData = {
  family: FamilyDetail;
  currentUserId: string | null;
  currentUserFullName: string | null;
  money: MoneyOverview | null;
  rejectedTransactions: RejectedTransactionRow[] | null;
  contributions: ContributionsOverview | null;
  projects: ProjectsOverview | null;
  loans: LoanRecord[] | null;
  auditEvents: FamilyAuditEvent[] | null;
  warnings: string[];
};
