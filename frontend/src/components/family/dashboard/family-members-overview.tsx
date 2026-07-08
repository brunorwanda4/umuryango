import { ArrowRightIcon, UsersIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  getInitials,
  getKinshipLabel,
  getVisibleMembers,
  joinedDateFormatter,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

const roleDotClass = {
  HEAD: "bg-primary",
  ADMIN: "bg-secondary-foreground",
  MEMBER: "bg-muted-foreground",
} as const;

export function FamilyMembersOverview({ family }: { family: FamilyDetail }) {
  const visibleMembers = getVisibleMembers(family);
  const hiddenCount = family.memberCount - visibleMembers.length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" aria-hidden="true" />
            People in this family
          </CardTitle>
          <CardDescription>
            Names, roles, and joining dates in one simple list.
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/family/${family.slug}/members`}>
            View members
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMembers.map((member) => {
            const isHead = member.authority === "HEAD";

            return (
              <div
                key={member.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-sm",
                  isHead && "ring-2 ring-primary/10",
                )}
              >
                <div
                  className={cn(
                    "relative rounded-full",
                    isHead && "ring-2 ring-primary/20",
                  )}
                >
                  <Avatar size={isHead ? "lg" : "sm"}>
                    {member.avatarUrl ? (
                      <AvatarImage
                        src={member.avatarUrl}
                        alt={member.fullName}
                      />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(member.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border-2 border-background",
                      roleDotClass[member.authority],
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {member.fullName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {getKinshipLabel(member)} - Joined{" "}
                    {joinedDateFormatter.format(new Date(member.joinedAt))}
                  </p>
                </div>
                <Badge
                  variant={isHead ? "default" : "outline"}
                  className="shrink-0"
                >
                  {AUTHORITY_LABELS[member.authority]}
                </Badge>
              </div>
            );
          })}
        </div>
        {hiddenCount > 0 ? (
          <div className="mt-3 rounded-lg border border-dashed bg-muted/30 p-3 text-center text-muted-foreground text-sm">
            +{hiddenCount} more member{hiddenCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
