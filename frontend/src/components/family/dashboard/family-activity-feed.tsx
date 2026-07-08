import { ActivityIcon, SparklesIcon, UserPlusIcon } from "lucide-react";
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
  type: "member_joined" | "family_created";
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
            const Icon =
              entry.type === "family_created" ? SparklesIcon : UserPlusIcon;

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

                  <Badge variant="outline" className="shrink-0">
                    {entry.type === "family_created" ? "Created" : "Joined"}
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
