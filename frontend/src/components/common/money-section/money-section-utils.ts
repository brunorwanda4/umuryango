import type { MinorUnitValue } from "@/lib/format-compact-number";

/**
 * Normalizes minor unit value to a valid BigInt string.
 * Strips fractional parts safely without floating-point math.
 */
export function normalizeMinorUnits(
  value: MinorUnitValue | null | undefined,
): string {
  if (value === null || value === undefined) return "0";
  const str = String(value).trim();
  if (!str) return "0";
  // Remove decimals if any (minor units should be integer, but handle defensive input)
  const integerPart = str.split(".")[0];
  try {
    return BigInt(integerPart).toString();
  } catch {
    return "0";
  }
}

/**
 * Adds multiple minor unit values using BigInt arithmetic without floating point.
 */
export function addMinorUnits(
  ...values: (MinorUnitValue | null | undefined)[]
): string {
  let sum = BigInt(0);
  for (const v of values) {
    if (v === null || v === undefined) continue;
    try {
      const sanitized = String(v).trim().split(".")[0];
      if (sanitized) {
        sum += BigInt(sanitized);
      }
    } catch {
      // Ignore invalid strings
    }
  }
  return sum.toString();
}

/**
 * Calculates a percentage integer safely using BigInt arithmetic.
 * Never introduces floating-point precision loss before final rounded display.
 * Returns an integer between 0 and 100.
 */
export function safeCalculatePercentage(
  itemMinorUnits: MinorUnitValue | null | undefined,
  totalMinorUnits: MinorUnitValue | null | undefined,
): number {
  try {
    const itemStr = normalizeMinorUnits(itemMinorUnits);
    const totalStr = normalizeMinorUnits(totalMinorUnits);

    const item = BigInt(itemStr);
    const total = BigInt(totalStr);

    if (total <= BigInt(0) || item <= BigInt(0)) return 0;
    // Basis points: (item * BigInt(10000)) / total
    const basisPoints = Number((item * BigInt(10000)) / total);
    return Math.min(100, Math.max(0, Math.round(basisPoints / 100)));
  } catch {
    return 0;
  }
}

/**
 * Direction-specific semantic color mappings.
 */
export function getDirectionTheme(direction: "income" | "expense") {
  if (direction === "income") {
    return {
      textAccent: "text-emerald-400",
      bgAccentSubtle: "bg-emerald-500/10",
      borderAccentSubtle: "border-emerald-500/20",
      indicatorColor: "emerald" as const,
      amountPrefix: "+",
      heroGradient: "from-zinc-950 via-[#0d1612] to-zinc-950",
      heroProgressGradient: "from-emerald-500 to-teal-400",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }

  return {
    textAccent: "text-rose-400",
    bgAccentSubtle: "bg-rose-500/10",
    borderAccentSubtle: "border-rose-500/20",
    indicatorColor: "rose" as const,
    amountPrefix: "-",
    heroGradient: "from-zinc-950 via-[#180e12] to-zinc-950",
    heroProgressGradient: "from-rose-500 to-orange-400",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
}
