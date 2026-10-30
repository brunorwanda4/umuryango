export function formatCompactRwf(
  amountMinorUnits: number | bigint | string,
  currency = "RWF",
) {
  const num =
    typeof amountMinorUnits === "bigint"
      ? Number(amountMinorUnits)
      : Number(amountMinorUnits) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${currency} ${formatted}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${currency} ${Math.round(abs / 1_000)}K`;
  }
  return `${sign}${currency} ${abs.toLocaleString()}`;
}

export function formatFullRwf(
  amountMinorUnits: number | bigint | string,
  currency = "RWF",
) {
  const num =
    typeof amountMinorUnits === "bigint"
      ? Number(amountMinorUnits)
      : Number(amountMinorUnits) || 0;
  return `${currency} ${num.toLocaleString()}`;
}

export function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "Personal account";
  switch (method) {
    case "MOBILE_MONEY":
      return "Mobile money";
    case "BANK_TRANSFER":
      return "Bank account";
    case "CASH":
      return "Cash";
    case "SAVINGS_WALLET":
      return "Savings wallet";
    default:
      return method.replace(/_/g, " ").toLowerCase();
  }
}
