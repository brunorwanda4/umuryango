import { ArrowRightIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { canOpenModule, DASHBOARD_MODULES } from "./dashboard-data";
import type { DashboardModule, FamilyDetail } from "./types";

export function FamilyWorkspaceGrid({ family }: { family: FamilyDetail }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg tracking-tight">
          Family workspace
        </h2>
        <p className="text-muted-foreground text-sm">
          Open the area you need. Each section keeps one type of family work
          easy to find.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_MODULES.map((module) => (
          <WorkspaceModuleCard
            key={module.segment}
            module={module}
            family={family}
          />
        ))}
      </div>
    </section>
  );
}

function WorkspaceModuleCard({
  module,
  family,
}: {
  module: DashboardModule;
  family: FamilyDetail;
}) {
  const Icon = module.icon;
  const canOpen = canOpenModule(family, module);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {module.title}
            </CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </div>
          <Badge variant={canOpen ? "secondary" : "outline"}>
            {canOpen ? "Open" : "Ask leader"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground text-sm leading-6">
          {module.helperText}
        </p>
        {canOpen ? (
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href={`/family/${family.slug}/${module.segment}`}>
              Open {module.title.toLowerCase()}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-muted-foreground text-sm">
            <LockIcon className="size-4 shrink-0" aria-hidden="true" />
            Ask a family leader for access.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
