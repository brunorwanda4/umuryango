import { describe, expect, it } from "bun:test";
import { invitationKeys, notificationKeys } from "./use-notifications";

describe("notificationKeys", () => {
  it("generates correct base and list keys", () => {
    expect(notificationKeys.all).toEqual(["notifications"]);
    expect(notificationKeys.lists()).toEqual(["notifications", "list"]);
    expect(notificationKeys.list({ page: 1, limit: 20 })).toEqual([
      "notifications",
      "list",
      { page: 1, limit: 20 },
    ]);
    expect(notificationKeys.summary()).toEqual(["notifications", "summary"]);
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
