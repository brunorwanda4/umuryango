import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCompactMinorUnits,
  formatCompactMoney,
  formatCompactNumber,
  formatCompactValue,
  formatFullMinorUnits,
  formatOptionalCompactMinorUnits,
  formatWithFallbackCompact,
  getFallbackCompactParts,
  minorUnitsToMajorNumber,
} from "./format-compact-number";

test("formats compact numbers using the expected short suffixes", () => {
  assert.equal(formatCompactNumber(999), "999");
  assert.equal(formatCompactNumber(1_000), "1K");
  assert.equal(formatCompactNumber(1_200), "1.2K");
  assert.equal(formatCompactNumber(10_000), "10K");
  assert.equal(formatCompactNumber(105_000), "105K");
  assert.equal(formatCompactNumber(999_999), "1M");
  assert.equal(formatCompactNumber(1_250_000), "1.3M");
  assert.equal(formatCompactNumber(12_500_000), "12.5M");
  assert.equal(formatCompactNumber(1_000_000_000), "1B");
  assert.equal(formatCompactNumber(2_500_000_000), "2.5B");
  assert.equal(formatCompactNumber(1_000_000_000_000), "1T");
});

test("formats compact money when currency is provided", () => {
  assert.equal(formatCompactMoney(1_200, "RWF"), "RWF 1.2K");
  assert.equal(formatCompactMoney(1_500_000, "RWF"), "RWF 1.5M");
  assert.equal(formatCompactMoney(2_300_000_000, "USD"), "$2.3B");
  assert.equal(formatCompactMoney(450, "RWF"), "RWF 450");
});

test("supports configured fraction digits and hidden currency", () => {
  assert.equal(
    formatCompactNumber(1_250_000, { maximumFractionDigits: 2 }),
    "1.25M",
  );
  assert.equal(
    formatCompactNumber(1_200, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }),
    "1.20K",
  );
  assert.equal(
    formatCompactValue(1_200, {
      currency: "RWF",
      showCurrency: false,
    }),
    "1.2K",
  );
  assert.equal(
    formatCompactMoney(1_200, "RWF", { showCurrency: false }),
    "1.2K",
  );
  assert.equal(
    formatCompactNumber(1_200, { currency: "RWF", showCurrency: true }),
    "RWF 1.2K",
  );
});

test("handles negative values, decimals, zero, and nullish values", () => {
  assert.equal(formatCompactNumber(-1_200), "-1.2K");
  assert.equal(formatCompactMoney(-1_250_000, "RWF"), "-RWF 1.3M");
  assert.equal(formatCompactNumber(12.34), "12.3");
  assert.equal(formatCompactNumber(0), "0");
  assert.equal(formatCompactMoney(0, "RWF"), "0");
  assert.equal(formatCompactNumber(null), "\u2014");
  assert.equal(formatCompactNumber(undefined), "\u2014");
});

test("formats persisted minor-unit money values", () => {
  assert.equal(minorUnitsToMajorNumber(120_000, "USD"), 1200);
  assert.equal(minorUnitsToMajorNumber(1_200, "RWF"), 1200);
  assert.equal(formatCompactMinorUnits(1_200, "RWF"), "RWF 1.2K");
  assert.equal(formatCompactMinorUnits(120_000, "USD"), "$1.2K");
  assert.equal(formatFullMinorUnits(1_200, "RWF"), "RWF 1,200");
  assert.equal(formatFullMinorUnits(120_000, "USD"), "USD 1,200.00");
  assert.equal(formatCompactMinorUnits(null, "RWF"), "\u2014");
  assert.equal(formatOptionalCompactMinorUnits(null, "RWF"), "No records");
  assert.equal(
    formatCompactMinorUnits(1_200, "RWF", { showCurrency: false }),
    "1.2K",
  );
  assert.equal(
    formatOptionalCompactMinorUnits(1_200, "RWF", "No records", {
      showCurrency: false,
    }),
    "1.2K",
  );
});

test("fallback formatter promotes rounded thresholds to the next suffix", () => {
  assert.deepEqual(getFallbackCompactParts(999_999, 1), {
    suffix: "M",
    value: 1,
  });
  assert.equal(
    formatWithFallbackCompact(999_999, {
      locale: "en",
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      showCurrency: false,
    }),
    "1M",
  );
  assert.equal(
    formatWithFallbackCompact(2_300_000_000, {
      currency: "USD",
      locale: "en",
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
      showCurrency: true,
    }),
    "$2.3B",
  );
});
