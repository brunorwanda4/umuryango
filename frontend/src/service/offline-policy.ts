const PERSONAL_TRANSACTION_ROUTE =
  /^\/families\/([^/]+)\/money\/transactions\/mine$/;
const FAMILY_TRANSACTION_ROUTE = /^\/families\/([^/]+)\/money\/transactions$/;

export type OfflineMoneyPayload = {
  amountMinorUnits?: string;
  categoryId?: string;
  currency?: string;
  date?: string;
  description?: string;
  notes?: string;
  type?: "INCOME" | "EXPENSE";
};

export function getOfflineMoneyMutation(url: string, data: unknown) {
  const personalMatch = PERSONAL_TRANSACTION_ROUTE.exec(url);
  const familyMatch = FAMILY_TRANSACTION_ROUTE.exec(url);
  const match = personalMatch ?? familyMatch;
  if (!match || !data || typeof data !== "object") return undefined;
  const payload = data as OfflineMoneyPayload;
  if (
    !match[1] ||
    !payload.categoryId ||
    !payload.amountMinorUnits ||
    !payload.description ||
    (payload.type !== "INCOME" && payload.type !== "EXPENSE")
  ) {
    return undefined;
  }

  return {
    command: personalMatch
      ? "create_offline_personal_transaction"
      : payload.type === "INCOME"
        ? "create_offline_income"
        : "create_offline_expense",
    input: {
      familyId: decodeURIComponent(match[1]),
      transactionType: payload.type,
      categoryId: payload.categoryId,
      amountMinorUnits: payload.amountMinorUnits,
      currency: payload.currency,
      description: payload.description,
      notes: payload.notes,
      transactionDate: payload.date,
    },
  } as const;
}

export function isOfflineSafeMutation(
  method: string,
  url: string,
  data: unknown,
) {
  return method === "post" && Boolean(getOfflineMoneyMutation(url, data));
}
