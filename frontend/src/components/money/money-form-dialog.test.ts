import assert from "node:assert/strict";
import test from "node:test";
import { getMoneyTransactionEndpoint } from "./money-form-dialog";

test("money form routes family and personal creates to their correct scopes", () => {
  assert.equal(
    getMoneyTransactionEndpoint({
      familyId: "family 1",
      isUpdate: false,
      scope: "family",
    }),
    "/families/family%201/money/transactions",
  );
  assert.equal(
    getMoneyTransactionEndpoint({
      familyId: "family 1",
      isUpdate: false,
      scope: "personal",
    }),
    "/families/family%201/money/transactions/mine",
  );
});
