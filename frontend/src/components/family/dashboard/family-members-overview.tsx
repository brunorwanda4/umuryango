import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardStatTile } from "@/components/common/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import {
  getAuthorityBreakdown,
  getInitials,
  getKinshipLabel,
  getVisibleMembers,
  joinedDateFormatter,
} from "./dashboard-data";
import type { FamilyDetail } from "./types";

const t = createTranslator("FamilyDashboard");

export function FamilyMembersOverview({ family }: { family: FamilyDetail }) {
  const membersHref = `/family/${encodeURIComponent(family.slug)}/members`;
  const visibleMembers = getVisibleMembers(family).slice(0, 4);
  const breakdown = getAuthorityBreakdown(family);
  const totalMembers = family.memberCount || family.members.length;
  const hiddenCount = Math.max(0, totalMembers - visibleMembers.length);

  return (
    <DashboardSectionCard
      title={t((m) => m.FamilyDashboard.membersCardTitle)}
      description={t((m) => m.FamilyDashboard.membersCardDesc)}
      actionHref={membersHref}
      actionLabel={t((m) => m.FamilyDashboard.viewMembers)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4">
        <DashboardStatTile
          label={t((m) => m.FamilyDashboard.totalMembersStat)}
          value={totalMembers}
        />
        {breakdown.map((item) => (
          <DashboardStatTile
            key={item.authority}
            label={item.label}
            value={item.members}
          />
        ))}
      </div>

      {visibleMembers.length === 0 ? (
        <DashboardEmptyState
          icon={<UsersIcon aria-hidden="true" />}
          title={t((m) => m.FamilyDashboard.noMembersTitle)}
          description={t((m) => m.FamilyDashboard.noMembersDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {visibleMembers.map((member) => {
            const joinedDate = new Date(member.joinedAt);
            const formattedJoined = Number.isNaN(joinedDate.getTime())
              ? member.joinedAt
              : joinedDateFormatter.format(joinedDate);

            return (
              <Link
                key={member.id}
                href={membersHref}
                className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 transition-colors hover:bg-muted/40"
              >
                <Avatar size="sm" className="size-8">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt={member.fullName} />
                  ) : null}
                  <AvatarFallback name={member.fullName} className="text-xs">
                    {getInitials(member.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-xs text-foreground">
                    {member.fullName}
                  </p>
                  <p className="truncate text-muted-foreground text-[10px]">
                    {getKinshipLabel(member)} ·{" "}
                    {t((m) => m.FamilyDashboard.joinedDate, {
                      date: formattedJoined,
                    })}
                  </p>
                </div>
                <Badge
                  variant={member.authority === "HEAD" ? "default" : "outline"}
                  className="shrink-0 text-[10px] px-1.5 py-0 h-4"
                >
                  {AUTHORITY_LABELS[member.authority]}
                </Badge>
              </Link>
            );
          })}
          {hiddenCount > 0 ? (
            <p className="text-muted-foreground text-[11px] pt-1">
              {t((m) => m.FamilyDashboard.moreMembers, { count: hiddenCount })}
            </p>
          ) : null}
        </div>
      )}
    </DashboardSectionCard>
  );
}
