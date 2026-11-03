import { describe, expect, test } from "bun:test";
import {
  calculatePullDistance,
  PULL_TO_REFRESH_THRESHOLD,
} from "./pull-to-refresh-utils";

describe("calculatePullDistance", () => {
  test("tracks resisted downward pulls and reaches the refresh threshold", () => {
    expect(
      calculatePullDistance({
        startX: 20,
        startY: 10,
        currentX: 24,
        currentY: 138,
      }),
    ).toBe(PULL_TO_REFRESH_THRESHOLD);
  });

  test("ignores upward and horizontal gestures", () => {
    expect(
      calculatePullDistance({
        startX: 20,
        startY: 100,
        currentX: 20,
        currentY: 80,
      }),
    ).toBe(0);
    expect(
      calculatePullDistance({
        startX: 20,
        startY: 20,
        currentX: 100,
        currentY: 50,
      }),
    ).toBe(0);
  });
});
