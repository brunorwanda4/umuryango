import { ArrowRightIcon, PlusIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppSidebarShell } from "@/components/app-shell/app-sidebar";
import { PageTitle } from "@/components/common/pages/page-title";
import { getKinshipLabel } from "@/components/family/dashboard/dashboard-data";
import type {
  FamilyDetail,
  FamilyMemberSummary,
} from "@/components/family/dashboard/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import enMessages from "@/messages/en.json";
import { serverApiRequest } from "@/service/server-api";
import {
  formatFamilyJoinedDate,
  normalizeFamilyDetail,
  normalizeUserFamilies,
  type UserFamily,
} from "./family-page-utils";

export const metadata: Metadata = {
  title: enMessages.FamilyPage.metadataTitle,
  description: enMessages.FamilyPage.metadataDescription,
};

type FamilyListItem =
  | { family: FamilyDetail; error?: undefined }
  | { family: UserFamily; error: string };

async function getFamilyListItems(): Promise<{
  items: FamilyListItem[];
  error: string | null;
}> {
  const t = createTranslator("FamilyPage");
  const familiesResponse = await serverApiRequest<undefined, UserFamily[]>(
    "get",
    "/families",
    undefined,
    { cache: "no-store" },
  );

  if (!familiesResponse.ok || !familiesResponse.data) {
    return {
      items: [],
      error:
        familiesResponse.message ?? t((m) => m.FamilyPage.loadFamiliesError),
    };
  }

  const families = normalizeUserFamilies(familiesResponse.data);

  if (!families) {
    return {
      items: [],
      error: t((m) => m.FamilyPage.loadFamiliesError),
    };
  }

  const items = await Promise.all(
    families.map(async (family) => {
      const detailResponse = await serverApiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(family.slug)}`,
        undefined,
        { cache: "no-store" },
      );

      if (detailResponse.ok && detailResponse.data) {
        return { family: normalizeFamilyDetail(detailResponse.data) };
      }

      return {
        family,
        error:
          detailResponse.message ?? t((m) => m.FamilyPage.loadMembersError),
      };
    }),
  );

  return { items, error: null };
}

export default async function FamilyPage() {
  const { items, error } = await getFamilyListItems();
  const t = createTranslator("FamilyPage");

  return (
    <AppSidebarShell mode="personal">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageTitle
          title={t((m) => m.FamilyPage.heading)}
          description={t((m) => m.FamilyPage.description)}
          actions={
            <Button asChild>
              <Link href="/family/new">
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                {t((m) => m.FamilyPage.createFamily)}
              </Link>
            </Button>
          }
        />

        {error ? <FamilyError message={error} /> : null}

        {!error && items.length === 0 ? <NoFamilies /> : null}

        {items.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <FamilyCard key={item.family.id} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </AppSidebarShell>
  );
}

function FamilyError({ message }: { message: string }) {
  const t = createTranslator("FamilyPage");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t((m) => m.FamilyPage.loadErrorTitle)}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NoFamilies() {
  const t = createTranslator("FamilyPage");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t((m) => m.FamilyPage.emptyTitle)}</EmptyTitle>
        <EmptyDescription>
          {t((m) => m.FamilyPage.emptyDescription)}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href="/family/new">{t((m) => m.FamilyPage.createFamily)}</Link>
      </Button>
    </Empty>
  );
}

function FamilyCard({ item }: { item: FamilyListItem }) {
  const t = createTranslator("FamilyPage");
  const { family } = item;
  const detail = "members" in family ? family : null;
  const memberCount = detail?.memberCount ?? 0;
  const members = Array.isArray(detail?.members) ? detail.members : [];

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{family.name}</CardTitle>
            <CardDescription>
              {detail
                ? t((m) => m.FamilyPage.membersCount, { count: memberCount })
                : t((m) => m.FamilyPage.membersUnavailable)}
            </CardDescription>
          </div>
          <Badge variant="outline">{AUTHORITY_LABELS[family.authority]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/family/${encodeURIComponent(family.slug)}`}>
              {t((m) => m.FamilyPage.openWorkspace)}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/family/${encodeURIComponent(family.slug)}/members`}>
              {t((m) => m.FamilyPage.viewMembers)}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {"error" in item ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
            {item.error}
          </p>
        ) : null}
        {members.length > 0 ? (
          <div className="flex flex-col">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
            {t((m) => m.FamilyPage.noActiveMembers)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MemberRow({ member }: { member: FamilyMemberSummary }) {
  const t = createTranslator("FamilyPage");
  const joinedDate = formatFamilyJoinedDate(member.joinedAt);

  return (
    <div className="flex items-center gap-3 border-border/60 border-b py-3 last:border-b-0">
      <Avatar size="sm">
        {member.avatarUrl ? (
          <AvatarImage src={member.avatarUrl} alt={member.fullName} />
        ) : null}
        <AvatarFallback name={member.fullName} />
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{member.fullName}</p>
        <p className="text-muted-foreground text-xs">
          {getKinshipLabel(member)}
          {joinedDate
            ? ` - ${t((m) => m.FamilyPage.joinedDate, { date: joinedDate })}`
            : null}
        </p>
      </div>
      <Badge variant={member.authority === "HEAD" ? "default" : "outline"}>
        {AUTHORITY_LABELS[member.authority]}
      </Badge>
    </div>
  );
}
