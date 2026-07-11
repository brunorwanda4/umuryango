import type { FamilyDetail } from "@/components/family/dashboard/types";
import type {
  Category,
  ExpenseTransaction,
} from "@/components/family/money/expenses/types-and-schemas";
import { MoneyExpensesPage } from "@/components/family/money/money-expenses-page";
import type { MoneyOverview } from "@/components/family/money/types";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { serverApiRequest } from "@/service/server-api";

async function getExpensesPageData(familyName: string) {
  const familyResponse = await serverApiRequest<undefined, FamilyDetail>(
    "get",
    `/families/${encodeURIComponent(familyName)}`,
    undefined,
    { cache: "no-store" },
  );

  if (!familyResponse.ok || !familyResponse.data) {
    return {
      family: null,
      transactions: [],
      categories: [],
      money: null,
      projects: [],
      error: familyResponse.message ?? "Failed to load family.",
    };
  }

  const family = familyResponse.data;
  const [
    transactionResponse,
    categoriesResponse,
    moneyResponse,
    projectsResponse,
  ] = await Promise.all([
    serverApiRequest<undefined, ExpenseTransaction[]>(
      "get",
      `/families/${encodeURIComponent(
        family.id,
      )}/money/transactions?type=EXPENSE`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, Category[]>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/categories`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, MoneyOverview>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/overview?period=month`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, ProjectsOverview>(
      "get",
      `/families/${encodeURIComponent(family.id)}/projects/overview?status=all`,
      undefined,
      { cache: "no-store" },
    ),
  ]);

  return {
    family,
    transactions: transactionResponse.ok
      ? (transactionResponse.data ?? [])
      : [],
    categories:
      categoriesResponse.ok && categoriesResponse.data
        ? categoriesResponse.data.filter((c) => c.type === "EXPENSE")
        : [],
    money: moneyResponse.ok ? (moneyResponse.data ?? null) : null,
    projects:
      projectsResponse.ok && projectsResponse.data?.projects
        ? projectsResponse.data.projects.map((project) => ({
            id: project.id,
            name: project.name,
            status: project.status,
          }))
        : [],
    error: null,
  };
}

export default async function FamilyMoneyExpensesPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const initialData = await getExpensesPageData(familyName);

  return (
    <MoneyExpensesPage familyName={familyName} initialData={initialData} />
  );
}
