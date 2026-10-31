import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTranslator, translate } from "./translate";

describe("translate and createTranslator", () => {
  const sampleMessages = {
    Common: {
      save: "Save",
      welcome: "Welcome, {name}!",
      itemsCount: {
        zero: "No items",
        one: "{count} item",
        other: "{count} items",
      },
    },
  } as unknown as Parameters<typeof translate>[0];

  it("translates simple keys", () => {
    assert.strictEqual(translate(sampleMessages, "Common.save"), "Save");
  });

  it("interpolates dynamic values", () => {
    assert.strictEqual(
      translate(sampleMessages, "Common.welcome", { name: "Alice" }),
      "Welcome, Alice!",
    );
  });

  it("handles pluralization correctly", () => {
    assert.strictEqual(
      translate(sampleMessages, "Common.itemsCount", { count: 0 }),
      "No items",
    );
    assert.strictEqual(
      translate(sampleMessages, "Common.itemsCount", { count: 1 }),
      "1 item",
    );
    assert.strictEqual(
      translate(sampleMessages, "Common.itemsCount", { count: 5 }),
      "5 items",
    );
  });

  it("falls back to key for missing translations", () => {
    assert.strictEqual(
      translate(sampleMessages, "NonExistent.key"),
      "NonExistent.key",
    );
  });

  it("works with createTranslator with namespace", () => {
    const t = createTranslator(sampleMessages, "Common");
    assert.strictEqual(t("save"), "Save");
    assert.strictEqual(t("welcome", { name: "Bob" }), "Welcome, Bob!");
    assert.strictEqual(t("itemsCount", { count: 1 }), "1 item");
    assert.strictEqual(t("itemsCount", { count: 4 }), "4 items");
  });
});
