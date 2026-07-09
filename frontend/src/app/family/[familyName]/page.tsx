import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { FamilyDashboard } from "@/components/family/dashboard/family-dashboard";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import type { MoneyOverview } from "@/components/family/money/types";
import { normalizeMoneyOverview } from "@/components/family/money/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { serverApiRequest } from "@/service/server-api";

async function getDashboardPageData(familyName: string) {
  const familyResponse = await serverApiRequest<undefined, FamilyDetail>(
    "get",
    `/families/${encodeURIComponent(familyName)}`,
    undefined,
    { cache: "no-store" },
  );

  if (!familyResponse.ok || !familyResponse.data) {
    return {
      family: null,
      money: null,
      moneyMessage: undefined,
      error: familyResponse.message ?? "Unable to load this family.",
    };
  }

  const family = familyResponse.data;
  const moneyResponse = await serverApiRequest<undefined, MoneyOverview>(
    "get",
    `/families/${encodeURIComponent(family.id)}/money/overview?period=month`,
    undefined,
    { cache: "no-store" },
  );

  return {
    family,
    money: moneyResponse.ok ? normalizeMoneyOverview(moneyResponse.data) : null,
    moneyMessage: moneyResponse.ok
      ? undefined
      : (moneyResponse.message ??
        "Money records are not available from the API yet."),
    error: null,
  };
}

export default async function FamilyDashboardPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const data = await getDashboardPageData(familyName);

  if (!data.family) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family not found</EmptyTitle>
          <EmptyDescription>
            {data.error} You may not have access, or it no longer exists.{" "}
            <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <FamilyDashboard
      family={data.family}
      money={data.money}
      moneyMessage={data.moneyMessage}
    />
  );
}
