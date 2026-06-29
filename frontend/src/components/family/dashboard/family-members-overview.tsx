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
import {
  getInitials,
  getKinshipLabel,
  getVisibleMembers,
  joinedDateFormatter,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

export function FamilyMembersOverview({ family }: { family: FamilyDetail }) {
  const visibleMembers = getVisibleMembers(family);

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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visibleMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar size="sm">
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                ) : null}
                <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {member.fullName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getKinshipLabel(member)} · Joined{" "}
                  {joinedDateFormatter.format(new Date(member.joinedAt))}
                </p>
              </div>
              <Badge variant="outline">
                {AUTHORITY_LABELS[member.authority]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
