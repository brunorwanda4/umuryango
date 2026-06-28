"use client";

import {
  BadgeDollarSignIcon,
  BellIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  type LucideIcon,
  ReceiptTextIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  type FamilyCapability,
  type FamilyKinship,
} from "@/lib/family-access";
import apiRequest from "@/service/api";

type FamilyMemberSummary = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  authority: FamilyAuthority;
  kinshipLabel: FamilyKinship | null;
  kinshipCustom: string | null;
  capabilities: FamilyCapability[];
  joinedAt: string;
};

type FamilyDetail = {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: string;
  contributionCadence: string;
  description: string | null;
  createdAt: string;
  authority: FamilyAuthority;
  capabilities: FamilyCapability[];
  memberCount: number;
  members: FamilyMemberSummary[];
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; family: FamilyDetail };

type ModuleCard = {
  title: string;
  description: string;
  segment: string;
  icon: LucideIcon;
};

const MODULE_CARDS: ModuleCard[] = [
  {
    title: "Money",
    description: "Income and expenses",
    segment: "money",
    icon: BadgeDollarSignIcon,
  },
  {
    title: "Contributions",
    description: "Campaigns and payments",
    segment: "contributions",
    icon: HandCoinsIcon,
  },
  {
    title: "Savings",
    description: "Goals and milestones",
    segment: "savings",
    icon: TargetIcon,
  },
  {
    title: "Debts",
    description: "Borrowed and lent",
    segment: "debts",
    icon: LandmarkIcon,
  },
  {
    title: "Projects",
    description: "Budgets and timelines",
    segment: "projects",
    icon: FolderKanbanIcon,
  },
  {
    title: "Events",
    description: "Upcoming and RSVP",
    segment: "events",
    icon: CalendarDaysIcon,
  },
  {
    title: "Reports",
    description: "Generated summaries",
    segment: "reports",
    icon: ReceiptTextIcon,
  },
  {
    title: "Announcements",
    description: "Notices and alerts",
    segment: "announcements",
    icon: BellIcon,
  },
];

export default function FamilyDashboardPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = use(params);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    (async () => {
      const response = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!active) return;

      if (response.ok && response.data) {
        setState({ status: "success", family: response.data });
      } else {
        setState({
          status: "error",
          message: response.message ?? "Unable to load this family.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [familyName]);

  if (state.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family not found</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or it no longer exists.{" "}
            <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <Dashboard family={state.family} />;
}

function Dashboard({ family }: { family: FamilyDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <FamilyHeader family={family} />
      <Separator />
      <MembersCard family={family} />
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-lg tracking-tight">Workspace</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_CARDS.map((module) => (
            <ModuleSummaryCard
              key={module.segment}
              module={module}
              familySlug={family.slug}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FamilyHeader({ family }: { family: FamilyDetail }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-bold text-2xl tracking-tight">{family.name}</h1>
        <Badge variant="secondary">{AUTHORITY_LABELS[family.authority]}</Badge>
      </div>
      {family.description ? (
        <p className="text-muted-foreground text-sm">{family.description}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{family.defaultCurrency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}

function MembersCard({ family }: { family: FamilyDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="size-4" aria-hidden="true" />
          Members
        </CardTitle>
        <CardDescription>
          {family.memberCount} {family.memberCount === 1 ? "member" : "members"}{" "}
          in this family
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {family.members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar size="sm">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt={member.fullName} />
              ) : null}
              <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-medium text-sm">
              {member.fullName}
            </span>
            <Badge variant="outline">
              {AUTHORITY_LABELS[member.authority]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ModuleSummaryCard({
  module,
  familySlug,
}: {
  module: ModuleCard;
  familySlug: string;
}) {
  const Icon = module.icon;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" aria-hidden="true" />
          {module.title}
        </CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <Empty className="flex-1 p-6">
          <EmptyHeader>
            <EmptyTitle className="text-base">Not set up yet</EmptyTitle>
            <EmptyDescription>
              <Link href={`/family/${familySlug}/${module.segment}`}>
                Open {module.title.toLowerCase()}
              </Link>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_CARDS.map((module) => (
          <Skeleton key={module.segment} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
