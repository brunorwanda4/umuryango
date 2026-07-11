import { formatCompactMinorUnits } from "@/lib/format-compact-number";

export function formatRf(amountMinorUnits: number) {
  return formatCompactMinorUnits(amountMinorUnits, "RWF", "en-RW");
}

export function formatCompactAmount(value: unknown) {
  return formatCompactMinorUnits(
    typeof value === "number" ? value : undefined,
    "RWF",
    "en-RW",
  );
}
