import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { loadFamilyDashboardData } from "@/components/family/dashboard/dashboard-data";
import { FamilyDashboard } from "@/components/family/dashboard/family-dashboard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { serverApiRequest } from "@/service/server-api";

async function fetchServerPath<T>(path: string): Promise<T> {
  const response = await serverApiRequest<undefined, T>(
    "get",
    path,
    undefined,
    { cache: "no-store" },
  );

  if (!response.ok || response.data === undefined) {
    throw new Error(response.message ?? "Unable to load family data.");
  }

  return response.data;
}

async function getDashboardPageData(familyName: string) {
  return loadFamilyDashboardData(familyName, fetchServerPath);
}

export default async function FamilyDashboardPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const result = await getDashboardPageData(familyName);
  const t = createTranslator("FamilyDashboard");

  if (!result.ok) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t((m) => m.FamilyDashboard.familyNotFound)}</EmptyTitle>
          <EmptyDescription>
            {t((m) => m.FamilyDashboard.familyNotFoundDesc, {
              error: result.errorMessage,
            })}{" "}
            <Link href="/family">
              {t((m) => m.FamilyDashboard.backToFamilies)}
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { data } = result;

  return (
    <FamilyDashboard
      family={data.family}
      currentUserId={data.currentUserId}
      currentUserFullName={data.currentUserFullName}
      money={data.money}
      rejectedTransactions={data.rejectedTransactions}
      contributions={data.contributions}
      projects={data.projects}
      loans={data.loans}
      auditEvents={data.auditEvents}
      warnings={data.warnings}
    />
  );
}
