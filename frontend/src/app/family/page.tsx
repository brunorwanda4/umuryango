import { ArrowRightIcon, PlusIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppSidebarShell } from "@/components/app-shell/app-sidebar";
import {
  getInitials,
  getKinshipLabel,
  joinedDateFormatter,
} from "@/components/family/dashboard/dashboard-data";
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
import { Separator } from "@/components/ui/separator";
import { AUTHORITY_LABELS, type FamilyAuthority } from "@/lib/family-access";
import { serverApiRequest } from "@/service/server-api";

export const metadata: Metadata = {
  title: "Family workspaces | Rwanda Family",
  description: "View the family workspaces and members you have access to.",
};

type UserFamily = {
  id: string;
  name: string;
  slug: string;
  authority: FamilyAuthority;
};

type FamilyListItem =
  | { family: FamilyDetail; error?: undefined }
  | { family: UserFamily; error: string };

async function getFamilyListItems(): Promise<{
  items: FamilyListItem[];
  error: string | null;
}> {
  const familiesResponse = await serverApiRequest<undefined, UserFamily[]>(
    "get",
    "/families",
    undefined,
    { cache: "no-store" },
  );

  if (!familiesResponse.ok || !familiesResponse.data) {
    return {
      items: [],
      error: familiesResponse.message ?? "Unable to load your families.",
    };
  }

  const items = await Promise.all(
    familiesResponse.data.map(async (family) => {
      const detailResponse = await serverApiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(family.slug)}`,
        undefined,
        { cache: "no-store" },
      );

      if (detailResponse.ok && detailResponse.data) {
        return { family: detailResponse.data };
      }

      return {
        family,
        error: detailResponse.message ?? "Unable to load family members.",
      };
    }),
  );

  return { items, error: null };
}

export default async function FamilyPage() {
  const { items, error } = await getFamilyListItems();

  return (
    <AppSidebarShell mode="personal">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              Family access
            </Badge>
            <div className="flex flex-col gap-1">
              <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
                Your families
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
                All family workspaces you belong to, with the active members
                returned by the family API.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/family/new">
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Create family
            </Link>
          </Button>
        </header>

        <Separator />

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
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Could not load families</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NoFamilies() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No families yet</EmptyTitle>
        <EmptyDescription>
          Create a family workspace to start managing members, money, documents,
          events, and reports.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href="/family/new">Create family</Link>
      </Button>
    </Empty>
  );
}

function FamilyCard({ item }: { item: FamilyListItem }) {
  const { family } = item;
  const detail = "members" in family ? family : null;
  const memberCount = detail?.memberCount ?? 0;
  const members = detail?.members ?? [];

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{family.name}</CardTitle>
            <CardDescription>
              {detail
                ? `${memberCount.toLocaleString()} ${
                    memberCount === 1 ? "member" : "members"
                  }`
                : "Members unavailable"}
            </CardDescription>
          </div>
          <Badge variant="outline">{AUTHORITY_LABELS[family.authority]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/family/${encodeURIComponent(family.slug)}`}>
              Open workspace
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/family/${encodeURIComponent(family.slug)}/members`}>
              View members
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
            No active members were returned for this family.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MemberRow({ member }: { member: FamilyMemberSummary }) {
  return (
    <div className="flex items-center gap-3 border-border/60 border-b py-3 last:border-b-0">
      <Avatar size="sm">
        {member.avatarUrl ? (
          <AvatarImage src={member.avatarUrl} alt={member.fullName} />
        ) : null}
        <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{member.fullName}</p>
        <p className="text-muted-foreground text-xs">
          {getKinshipLabel(member)} - Joined{" "}
          {joinedDateFormatter.format(new Date(member.joinedAt))}
        </p>
      </div>
      <Badge variant={member.authority === "HEAD" ? "default" : "outline"}>
        {AUTHORITY_LABELS[member.authority]}
      </Badge>
    </div>
  );
}
