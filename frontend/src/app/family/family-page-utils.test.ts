import { describe, expect, it } from "bun:test";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  formatFamilyJoinedDate,
  normalizeFamilyDetail,
  normalizeUserFamilies,
} from "./family-page-utils";

describe("family page data normalization", () => {
  it("rejects a non-array family list payload", () => {
    expect(normalizeUserFamilies({ items: [] })).toBeNull();
  });

  it("filters malformed family list entries", () => {
    expect(
      normalizeUserFamilies([
        {
          id: "family-1",
          name: "Uwase Family",
          slug: "uwase-family",
          authority: "HEAD",
        },
        { id: "broken" },
      ]),
    ).toEqual([
      {
        id: "family-1",
        name: "Uwase Family",
        slug: "uwase-family",
        authority: "HEAD",
      },
    ]);
  });

  it("removes malformed members and derives a safe member count", () => {
    const detail = {
      id: "family-1",
      name: "Uwase Family",
      slug: "uwase-family",
      country: "RW",
      defaultCurrency: "RWF",
      contributionCadence: "monthly",
      description: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      authority: "HEAD",
      capabilities: [],
      memberCount: Number.NaN,
      members: [
        {
          id: "member-1",
          userId: "user-1",
          fullName: "Aline Uwase",
          avatarUrl: null,
          authority: "HEAD",
          kinshipLabel: null,
          kinshipCustom: null,
          capabilities: [],
          joinedAt: "2026-06-01T00:00:00.000Z",
        },
        { id: "broken" },
      ],
    } as FamilyDetail;

    const normalized = normalizeFamilyDetail(detail);

    expect(normalized.memberCount).toBe(1);
    expect(normalized.members).toHaveLength(1);
  });

  it("does not format an invalid membership date", () => {
    expect(formatFamilyJoinedDate("not-a-date")).toBeNull();
    expect(formatFamilyJoinedDate(null)).toBeNull();
  });
});
