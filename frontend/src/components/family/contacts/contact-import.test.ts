import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTACT_IMPORT_BATCH_SIZE,
  importContactsInBatches,
} from "./contact-import";
import type { ImportedContact } from "./contact-utils";

const contacts = Array.from(
  { length: CONTACT_IMPORT_BATCH_SIZE * 2 + 1 },
  (_, index): ImportedContact => ({
    fullName: `Contact ${index + 1}`,
    phoneNumber: `+250700${String(index).padStart(6, "0")}`,
  }),
);

describe("contact import batching", () => {
  it("imports every contact and aggregates each batch result", async () => {
    const batchSizes: number[] = [];
    const result = await importContactsInBatches(
      "family-1",
      contacts,
      async (_familyId, batch) => {
        batchSizes.push(batch.length);
        return {
          ok: true,
          data: { created: batch.length - 1, merged: 1 },
        };
      },
    );

    assert.deepEqual(batchSizes, [250, 250, 1]);
    assert.deepEqual(result, {
      ok: true,
      created: 498,
      merged: 3,
      processed: 501,
    });
  });

  it("reports completed records when a later batch fails", async () => {
    let calls = 0;
    const result = await importContactsInBatches(
      "family-1",
      contacts,
      async (_familyId, batch) => {
        calls += 1;
        return calls === 1
          ? { ok: true, data: { created: batch.length, merged: 0 } }
          : { ok: false, message: "Import unavailable" };
      },
    );

    assert.deepEqual(result, {
      ok: false,
      created: 250,
      merged: 0,
      processed: 250,
      message: "Import unavailable",
    });
  });
});
