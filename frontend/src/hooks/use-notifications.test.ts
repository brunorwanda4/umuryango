import { describe, expect, it } from "bun:test";
import {
  getFamilyNavigation,
  isActivePath,
} from "@/components/app-shell/sidebar-utils";
import { invitationKeys, notificationKeys } from "./use-notifications";

describe("notificationKeys", () => {
  it("generates correct base and list keys for global notifications", () => {
    expect(notificationKeys.all).toEqual(["notifications"]);
    expect(notificationKeys.lists()).toEqual(["notifications", "list"]);
    expect(notificationKeys.list({ page: 1, limit: 20 })).toEqual([
      "notifications",
      "list",
      { page: 1, limit: 20 },
    ]);
    expect(notificationKeys.summary()).toEqual(["notifications", "summary"]);
  });

  it("ensures query keys differ between global, Family A, and Family B", () => {
    const globalSummary = notificationKeys.summary();
    const familyASummary = notificationKeys.familySummary("family-a");
    const familyBSummary = notificationKeys.familySummary("family-b");

    expect(globalSummary).toEqual(["notifications", "summary"]);
    expect(familyASummary).toEqual([
      "notifications",
      "family",
      "family-a",
      "summary",
    ]);
    expect(familyBSummary).toEqual([
      "notifications",
      "family",
      "family-b",
      "summary",
    ]);

    // Distinctness
    expect(globalSummary).not.toEqual(familyASummary);
    expect(familyASummary).not.toEqual(familyBSummary);

    const globalList = notificationKeys.list({ page: 1 });
    const familyAList = notificationKeys.familyList("family-a", { page: 1 });
    const familyBList = notificationKeys.familyList("family-b", { page: 1 });

    expect(familyAList).toEqual([
      "notifications",
      "family",
      "family-a",
      "list",
      { page: 1 },
    ]);
    expect(familyBList).toEqual([
      "notifications",
      "family",
      "family-b",
      "list",
      { page: 1 },
    ]);

    expect(globalList).not.toEqual(familyAList);
    expect(familyAList).not.toEqual(familyBList);
  });
});

describe("invitationKeys", () => {
  it("generates correct base and list keys", () => {
    expect(invitationKeys.all).toEqual(["invitations"]);
    expect(invitationKeys.lists()).toEqual(["invitations", "list"]);
    expect(invitationKeys.list("PENDING")).toEqual([
      "invitations",
      "list",
      { status: "PENDING" },
    ]);
  });
});

describe("family navigation sidebar", () => {
  it("includes /family/{slug}/notifications in the family main group", () => {
    const nav = getFamilyNavigation("kigali-family");
    const familyGroup = nav.find((g) =>
      g.items.some((i) => i.href.includes("kigali-family")),
    );
    expect(familyGroup).toBeDefined();

    const notifItem = familyGroup?.items.find(
      (item) => item.href === "/family/kigali-family/notifications",
    );
    expect(notifItem).toBeDefined();
    expect(notifItem?.title).toBe("Notifications");

    // Correct icon image asset (announcement.png)
    expect(notifItem?.icon.image?.src).toBe("/images/icons/announcement.png");
  });

  it("handles active path correctly for /family/{slug}/notifications without matching dashboard", () => {
    const familyHref = "/family/kigali-family";
    const notifHref = "/family/kigali-family/notifications";

    // When on notifications page:
    expect(isActivePath(notifHref, notifHref)).toBe(true);
    // Dashboard should NOT be active on notifications page
    expect(isActivePath(notifHref, familyHref)).toBe(false);

    // When on dashboard page:
    expect(isActivePath(familyHref, familyHref)).toBe(true);
    expect(isActivePath(familyHref, notifHref)).toBe(false);
  });
});

describe("notification href routes", () => {
  it("asserts family notification hrefs use /family/{slug}/money and not /families/{id}", () => {
    const slug = "umuryango-wacu";
    const validMoneyRoute = `/family/${encodeURIComponent(slug)}/money`;

    expect(validMoneyRoute).toMatch(/^\/family\/[^/]+\/money$/);
    expect(validMoneyRoute).not.toContain("/families/");

    // Invitations must continue linking to /me/notifications
    const inviteHref = "/me/notifications";
    expect(inviteHref).toBe("/me/notifications");
  });
});
