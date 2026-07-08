import {
  ActivityIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  SparklesIcon,
  TargetIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
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
import { AUTHORITY_LABELS } from "@/lib/family-access";
import {
  formatRelativeTime,
  getInitials,
  getKinshipLabel,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

const MAX_ENTRIES = 6;

type ActivityEntry = {
  id: string;
  type:
    | "member_joined"
    | "family_created"
    | "expense_recorded"
    | "income_recorded"
    | "goal_updated"
    | "contribution_paid";
  name: string;
  avatarUrl: string | null;
  description: string;
  timestamp: Date;
};

function buildActivityEntries(family: FamilyDetail): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const member of family.members) {
    const joinedAt = new Date(member.joinedAt);

    if (Number.isNaN(joinedAt.getTime())) {
      continue;
    }

    const roleLabel = AUTHORITY_LABELS[member.authority];
    const kinship = getKinshipLabel(member);

    entries.push({
      id: `member-${member.id}`,
      type: "member_joined",
      name: member.fullName,
      avatarUrl: member.avatarUrl,
      description: `joined as ${roleLabel} - ${kinship}`,
      timestamp: joinedAt,
    });
  }

  const createdAt = new Date(family.createdAt);

  if (!Number.isNaN(createdAt.getTime())) {
    entries.push({
      id: `family-${family.id}`,
      type: "family_created",
      name: family.name,
      avatarUrl: null,
      description: "family was created",
      timestamp: createdAt,
    });
  }

  const isDemo = family.members.some((m) => m.id.startsWith("demo-"));
  if (isDemo) {
    const now = new Date();

    // 1. Marie Claire recorded an expense for Food 2 days ago
    const marieClaire = family.members.find((m) =>
      m.fullName.includes("Marie Claire"),
    );
    if (marieClaire) {
      const date = new Date(now);
      date.setDate(now.getDate() - 2);
      entries.push({
        id: "demo-activity-1",
        type: "expense_recorded",
        name: marieClaire.fullName,
        avatarUrl: marieClaire.avatarUrl,
        description: "recorded an expense of RWF 45,000 for Food",
        timestamp: date,
      });
    }

    // 2. Jean Paul updated savings goal: Emergency Fund 4 days ago
    const jeanPaul = family.members.find((m) =>
      m.fullName.includes("Jean Paul"),
    );
    if (jeanPaul) {
      const date = new Date(now);
      date.setDate(now.getDate() - 4);
      entries.push({
        id: "demo-activity-2",
        type: "goal_updated",
        name: jeanPaul.fullName,
        avatarUrl: jeanPaul.avatarUrl,
        description: "updated savings goal: Emergency Fund to RWF 3,200,000",
        timestamp: date,
      });
    }

    // 3. Jean Paul recorded income: RWF 1,200,000 from Salary 6 days ago
    if (jeanPaul) {
      const date = new Date(now);
      date.setDate(now.getDate() - 6);
      entries.push({
        id: "demo-activity-3",
        type: "income_recorded",
        name: jeanPaul.fullName,
        avatarUrl: jeanPaul.avatarUrl,
        description: "recorded income of RWF 1,200,000 from Salary",
        timestamp: date,
      });
    }

    // 4. Charles Mugisha paid contribution: RWF 50,000 10 days ago
    const charles = family.members.find((m) => m.fullName.includes("Charles"));
    if (charles) {
      const date = new Date(now);
      date.setDate(now.getDate() - 10);
      entries.push({
        id: "demo-activity-4",
        type: "contribution_paid",
        name: charles.fullName,
        avatarUrl: charles.avatarUrl,
        description: "contributed RWF 50,000 to Monthly Family Contribution",
        timestamp: date,
      });
    }
  }

  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return entries;
}

export function FamilyActivityFeed({ family }: { family: FamilyDetail }) {
  const allEntries = buildActivityEntries(family);
  const visibleEntries = allEntries.slice(0, MAX_ENTRIES);
  const remainingCount = allEntries.length - visibleEntries.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="size-4" aria-hidden="true" />
          Recent activity
        </CardTitle>
        <CardDescription>
          Latest updates from members and family setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col gap-0">
          {visibleEntries.map((entry, index) => {
            const isLast = index === visibleEntries.length - 1;

            let Icon = UserPlusIcon;
            let badgeText = "Joined";
            let badgeVariant:
              | "default"
              | "secondary"
              | "destructive"
              | "outline" = "outline";

            if (entry.type === "family_created") {
              Icon = SparklesIcon;
              badgeText = "Created";
            } else if (entry.type === "expense_recorded") {
              Icon = ArrowUpIcon;
              badgeText = "Expense";
              badgeVariant = "destructive";
            } else if (entry.type === "income_recorded") {
              Icon = ArrowDownIcon;
              badgeText = "Income";
              badgeVariant = "default";
            } else if (entry.type === "goal_updated") {
              Icon = TargetIcon;
              badgeText = "Savings";
              badgeVariant = "secondary";
            } else if (entry.type === "contribution_paid") {
              Icon = LandmarkIcon;
              badgeText = "Payment";
              badgeVariant = "secondary";
            }

            return (
              <div
                key={entry.id}
                className="group relative flex gap-3 pb-4 last:pb-0"
              >
                {isLast ? null : (
                  <div
                    className="absolute top-8 bottom-0 left-3 w-px bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background transition-colors group-hover:border-primary group-hover:bg-primary/10">
                  <Icon
                    className="size-3 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors group-hover:bg-muted/50">
                  <Avatar size="sm">
                    {entry.avatarUrl ? (
                      <AvatarImage src={entry.avatarUrl} alt={entry.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{entry.name}</span>{" "}
                      <span className="text-muted-foreground">
                        {entry.description}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>

                  <Badge variant={badgeVariant} className="shrink-0">
                    {badgeText}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {remainingCount > 0 ? (
          <p className="mt-3 text-center text-muted-foreground text-xs">
            +{remainingCount} more {remainingCount === 1 ? "event" : "events"}
          </p>
        ) : null}

        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={`/family/${family.slug}/members`}>
            View all member activity
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
