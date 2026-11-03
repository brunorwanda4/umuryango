import type {
  FamilyDetail,
  FamilyMemberSummary,
} from "@/components/family/dashboard/types";
import { AUTHORITY_LABELS, type FamilyAuthority } from "@/lib/family-access";

export type UserFamily = {
  id: string;
  name: string;
  slug: string;
  authority: FamilyAuthority;
};

const joinedDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isFamilyAuthority(value: unknown): value is FamilyAuthority {
  return typeof value === "string" && value in AUTHORITY_LABELS;
}

function isUserFamily(value: unknown): value is UserFamily {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    isFamilyAuthority(value.authority)
  );
}

function isFamilyMember(value: unknown): value is FamilyMemberSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.fullName === "string" &&
    isFamilyAuthority(value.authority)
  );
}

export function normalizeUserFamilies(value: unknown): UserFamily[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter(isUserFamily);
}

export function normalizeFamilyDetail(detail: FamilyDetail): FamilyDetail {
  const members = Array.isArray(detail.members)
    ? detail.members.filter(isFamilyMember)
    : [];
  const memberCount =
    typeof detail.memberCount === "number" &&
    Number.isFinite(detail.memberCount) &&
    detail.memberCount >= 0
      ? detail.memberCount
      : members.length;

  return { ...detail, memberCount, members };
}

export function formatFamilyJoinedDate(value: unknown): string | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : joinedDateFormatter.format(date);
}
