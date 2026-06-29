import type { LucideIcon } from "lucide-react";
import type {
  FamilyAuthority,
  FamilyCapability,
  FamilyKinship,
} from "@/lib/family-access";

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
  description: string | null;
  createdAt: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
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
