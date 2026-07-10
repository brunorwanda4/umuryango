export function formatRf(amountMinorUnits: number) {
  return `RF ${new Intl.NumberFormat("en-RW", {
    maximumFractionDigits: 0,
  }).format(amountMinorUnits)}`;
}

export function formatCompactAmount(value: unknown) {
  if (typeof value !== "number") return "";
  if (value === 0) return "0";
  return `${Math.round(value / 1000)}K`;
}
