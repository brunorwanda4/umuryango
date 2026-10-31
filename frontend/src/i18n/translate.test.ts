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
    PersonalSettings: {
      tabs: {
        profile: "Profile settings",
        account: "Account security",
      },
    },
  };

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

  it("works with createTranslator with namespace and string keys", () => {
    const t = createTranslator(sampleMessages, "Common");
    assert.strictEqual(t("save"), "Save");
    assert.strictEqual(t("welcome", { name: "Bob" }), "Welcome, Bob!");
    assert.strictEqual(t("itemsCount", { count: 1 }), "1 item");
    assert.strictEqual(t("itemsCount", { count: 4 }), "4 items");
  });

  it("supports root selectors t((m) => m.Namespace.key) regardless of namespace", () => {
    const tCommon = createTranslator(sampleMessages, "Common");
    assert.strictEqual(
      tCommon((m) => m.Common.save),
      "Save",
    );
    assert.strictEqual(
      tCommon((m) => m.Common.welcome, { name: "Charlie" }),
      "Welcome, Charlie!",
    );
    assert.strictEqual(
      tCommon((m) => m.Common.itemsCount, { count: 3 }),
      "3 items",
    );
    assert.strictEqual(
      tCommon((m) => m.PersonalSettings.tabs.profile),
      "Profile settings",
    );
  });

  it("resolves selectors against the real en.json catalog", () => {
    const t = createTranslator("FamilyExpenses");
    assert.strictEqual(
      t((m) => m.FamilyExpenses.tabData),
      "Data",
    );
    assert.strictEqual(
      t((m) => m.FamilyExpenses.addExpense),
      "Add Expense",
    );
    assert.strictEqual(t("addExpense"), "Add Expense");
  });

  it("returns an empty string when a selector points to nothing", () => {
    const t = createTranslator(sampleMessages);
    assert.strictEqual(
      t((m) => (m as unknown as Record<string, string | undefined>).missing),
      "",
    );
  });

  it("supports translate() with function selector syntax", () => {
    assert.strictEqual(
      translate(sampleMessages, (m) => m.Common.save),
      "Save",
    );
    assert.strictEqual(
      translate(sampleMessages, (m) => m.PersonalSettings.tabs.profile),
      "Profile settings",
    );
  });
});
