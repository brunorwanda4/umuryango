import type { ContactListResponse } from "@/components/family/contacts/types-and-schemas";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import { MoneyLoansPage } from "@/components/family/money/money-loans-page";
import { serverApiRequest } from "@/service/server-api";

async function getLoansPageData(familyName: string) {
  const familyResponse = await serverApiRequest<undefined, FamilyDetail>(
    "get",
    `/families/${encodeURIComponent(familyName)}`,
    undefined,
    { cache: "no-store" },
  );

  if (!familyResponse.ok || !familyResponse.data) {
    return {
      family: null,
      loans: [],
      contacts: [],
      error: familyResponse.message ?? "Failed to load family.",
    };
  }

  const family = familyResponse.data;
  const [loansResponse, contactsResponse] = await Promise.all([
    serverApiRequest<undefined, LoanRecord[]>(
      "get",
      `/families/${encodeURIComponent(family.id)}/money/loans`,
      undefined,
      { cache: "no-store" },
    ),
    serverApiRequest<undefined, ContactListResponse>(
      "get",
      `/families/${encodeURIComponent(
        family.id,
      )}/contacts?limit=100&loanOnly=false`,
      undefined,
      { cache: "no-store" },
    ),
  ]);

  return {
    family,
    loans: loansResponse.ok ? (loansResponse.data ?? []) : [],
    contacts:
      contactsResponse.ok && contactsResponse.data
        ? (contactsResponse.data.items ?? [])
        : [],
    error: null,
  };
}

export default async function FamilyMoneyLoansPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const initialData = await getLoansPageData(familyName);

  return <MoneyLoansPage familyName={familyName} initialData={initialData} />;
}
