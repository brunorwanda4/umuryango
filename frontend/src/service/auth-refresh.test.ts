import assert from "node:assert/strict";
import test from "node:test";
import { classifyAuthRefreshResponse } from "./auth-refresh";

test("distinguishes rejected refresh tokens from backend failures", () => {
  assert.equal(
    classifyAuthRefreshResponse({ ok: true, status: 200 }),
    "refreshed",
  );
  assert.equal(
    classifyAuthRefreshResponse({ ok: false, status: 401 }),
    "unauthorized",
  );
  assert.equal(
    classifyAuthRefreshResponse({ ok: false, status: 503 }),
    "unavailable",
  );
});
