import { describe, expect, test } from "bun:test";
import {
  getOfflineMoneyMutation,
  isOfflineSafeMutation,
} from "@/service/offline-policy";

const expense = {
  amountMinorUnits: "12500",
  categoryId: "category-1",
  currency: "RWF",
  date: "2026-11-02",
  description: "School supplies",
  idempotencyKey: "stable-key",
  type: "EXPENSE" as const,
};

describe("offline API policy", () => {
  test("maps a personal expense to the native outbox command", () => {
    expect(
      getOfflineMoneyMutation(
        "/families/family%20id/money/transactions/mine",
        expense,
      ),
    ).toEqual({
      command: "create_offline_personal_transaction",
      input: {
        familyId: "family id",
        transactionType: "EXPENSE",
        categoryId: "category-1",
        amountMinorUnits: "12500",
        currency: "RWF",
        description: "School supplies",
        notes: undefined,
        transactionDate: "2026-11-02",
      },
    });
  });

  test("maps family income to the permission-checked native outbox command", () => {
    expect(
      getOfflineMoneyMutation("/families/family-1/money/transactions", {
        ...expense,
        type: "INCOME",
      }),
    ).toEqual({
      command: "create_offline_income",
      input: {
        familyId: "family-1",
        transactionType: "INCOME",
        categoryId: "category-1",
        amountMinorUnits: "12500",
        currency: "RWF",
        description: "School supplies",
        notes: undefined,
        transactionDate: "2026-11-02",
      },
    });
  });

  test("keeps approval and permission actions online-only", () => {
    expect(
      isOfflineSafeMutation(
        "post",
        "/families/family-1/money/transactions/tx-1/approve",
        {},
      ),
    ).toBe(false);
    expect(
      isOfflineSafeMutation("patch", "/families/family-1/members/member-1", {}),
    ).toBe(false);
  });
});
