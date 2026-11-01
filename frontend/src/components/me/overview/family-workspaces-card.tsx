import { PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import type { OverviewFamily } from "./personal-overview-data";

function getFamilyInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function FamilyWorkspacesCard({
  families,
}: {
  families: OverviewFamily[];
}) {
  const t = createTranslator("PersonalOverview.familyWorkspaces");

  return (
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.familyWorkspaces.title)}
      description={t((m) => m.PersonalOverview.familyWorkspaces.description)}
      actionHref="/family"
      actionLabel={t((m) => m.PersonalOverview.familyWorkspaces.viewAll)}
      footer={
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full rounded-xl border-dashed border-border/80 text-xs font-semibold hover:border-border hover:bg-muted/50"
        >
          <Link href="/family/new">
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {t((m) => m.PersonalOverview.familyWorkspaces.createWorkspace)}
          </Link>
        </Button>
      }
    >
      {families.length === 0 ? (
        <DashboardEmptyState
          icon={<UsersIcon aria-hidden="true" />}
          title={t((m) => m.PersonalOverview.familyWorkspaces.emptyTitle)}
          description={t((m) => m.PersonalOverview.familyWorkspaces.emptyDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {families.slice(0, 3).map((family) => {
            const initials = getFamilyInitials(family.name);
            return (
              <div
                key={family.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate font-semibold text-xs text-foreground">
                        {family.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {AUTHORITY_LABELS[family.authority]}
                      </Badge>
                    </div>
                    <p className="truncate text-muted-foreground text-[10px]">
                      {family.memberCount === null
                        ? (family.description ??
                          t(
                            (m) =>
                              m.PersonalOverview.familyWorkspaces.workspace,
                          ))
                        : t(
                            (m) =>
                              m.PersonalOverview.familyWorkspaces.memberCount,
                            { count: family.memberCount },
                          )}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 shrink-0"
                >
                  <Link href={`/family/${encodeURIComponent(family.slug)}`}>
                    {t(
                      (m) => m.PersonalOverview.familyWorkspaces.openWorkspace,
                    )}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
