import { ArrowRightIcon, PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import type { OverviewFamily } from "./personal-overview-data";

export function FamilyWorkspacesCard({
  families,
}: {
  families: OverviewFamily[];
}) {
  const t = createTranslator("PersonalOverview.familyWorkspaces");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t((m) => m.PersonalOverview.familyWorkspaces.title)}
        </CardTitle>
        <CardDescription>
          {t((m) => m.PersonalOverview.familyWorkspaces.description)}
        </CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/family">
              {t((m) => m.PersonalOverview.familyWorkspaces.viewAll)}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {families.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                {t((m) => m.PersonalOverview.familyWorkspaces.emptyTitle)}
              </EmptyTitle>
              <EmptyDescription>
                {t((m) => m.PersonalOverview.familyWorkspaces.emptyDesc)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {families.slice(0, 3).map((family) => (
              <div
                key={family.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UsersIcon
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{family.name}</p>
                    <Badge variant="outline">
                      {AUTHORITY_LABELS[family.authority]}
                    </Badge>
                  </div>
                  <p className="truncate text-muted-foreground text-xs">
                    {family.memberCount === null
                      ? (family.description ??
                        t((m) => m.PersonalOverview.familyWorkspaces.workspace))
                      : t(
                          (m) =>
                            m.PersonalOverview.familyWorkspaces.memberCount,
                          { count: family.memberCount },
                        )}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/family/${encodeURIComponent(family.slug)}`}>
                    {t(
                      (m) => m.PersonalOverview.familyWorkspaces.openWorkspace,
                    )}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t">
        <Button asChild size="sm" variant="outline">
          <Link href="/family/new">
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {t((m) => m.PersonalOverview.familyWorkspaces.createWorkspace)}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
