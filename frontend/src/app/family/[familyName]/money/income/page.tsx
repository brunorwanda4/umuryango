import type { FamilyDetail } from "@/components/family/dashboard/types";
import type {
  Category,
  IncomeTransaction,
} from "@/components/family/money/income/types-and-schemas";
import { MoneyIncomePage } from "@/components/family/money/money-income-page";
import type { CurrentUser } from "@/hooks/use-current-user";
import { serverApiRequest } from "@/service/server-api";

async function getIncomePageData(familyName: string) {
  const [familyResponse, currentUserResponse] = await Promise.all([
    serverApiRequest<undefined, FamilyDetail>(
      "get",
      `/families/${encodeURIComponent(familyName)}`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, { user?: CurrentUser }>(
      "get",
      "/auth/me",
      undefined,
      { cache: "no-store" },
    ),
  ]);

  if (!familyResponse.ok || !familyResponse.data) {
    return {
      family: null,
      transactions: [],
      categories: [],
      currentUser: currentUserResponse.data?.user ?? null,
      error: familyResponse.message ?? "Failed to load family.",
    };
  }

  const family = familyResponse.data;
  const [transactionsResponse, categoriesResponse] = await Promise.all([
    serverApiRequest<undefined, IncomeTransaction[]>(
      "get",
      `/families/${encodeURIComponent(
        family.id,
      )}/money/transactions?type=INCOME`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, Category[]>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/categories`,
      undefined,
      { cache: "no-store" },
    ),
  ]);

  return {
    family,
    transactions: transactionsResponse.ok
      ? (transactionsResponse.data ?? [])
      : [],
    categories:
      categoriesResponse.ok && categoriesResponse.data
        ? categoriesResponse.data.filter(
            (category) => category.type === "INCOME",
          )
        : [],
    currentUser: currentUserResponse.data?.user ?? null,
    error: null,
  };
}

export default async function FamilyMoneyIncomePage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const initialData = await getIncomePageData(familyName);

  return <MoneyIncomePage familyName={familyName} initialData={initialData} />;
}
