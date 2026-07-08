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
import { Separator } from "@/components/ui/separator";
import { hasCapability } from "@/lib/family-access";
import { canOpenModule, DASHBOARD_MODULES } from "./dashboard-data";
import type { DashboardModule, FamilyDetail } from "./types";

const FINANCIAL_SEGMENTS = new Set([
  "money",
  "contributions",
  "savings",
  "debts",
]);
const OPERATIONS_SEGMENTS = new Set([
  "projects",
  "events",
  "reports",
  "announcements",
]);

interface ModuleGroup {
  title: string;
  description: string;
  modules: DashboardModule[];
}

function getModuleGroups(): ModuleGroup[] {
  const financial = DASHBOARD_MODULES.filter((m) =>
    FINANCIAL_SEGMENTS.has(m.segment),
  );
  const operations = DASHBOARD_MODULES.filter((m) =>
    OPERATIONS_SEGMENTS.has(m.segment),
  );

  return [
    {
      title: "Financial management",
      description: "Track income, expenses, savings, and debts.",
      modules: financial,
    },
    {
      title: "Operations & communication",
      description: "Projects, events, reports, and family notices.",
      modules: operations,
    },
  ];
}

export function FamilyWorkspaceGrid({ family }: { family: FamilyDetail }) {
  const groups = getModuleGroups();

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

      {groups.map((group, index) => (
        <div key={group.title} className="flex flex-col gap-3">
          {index > 0 && <Separator />}
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-base tracking-tight">
              {group.title}
            </h3>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.modules.map((module) => (
              <WorkspaceModuleCard
                key={module.segment}
                module={module}
                family={family}
              />
            ))}
          </div>
        </div>
      ))}
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
  const canUse = module.requiredCapabilities?.some((capability) =>
    hasCapability(family, capability),
  );
  const statusLabel = canOpen ? (canUse ? "Allowed" : "View") : "Locked";
  const previewLabel = getModulePreviewLabel(family, module);

  return (
    <Card className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-full bg-primary/10 p-2">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
              </div>
              {module.title}
            </CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </div>
          <Badge variant={canOpen ? "secondary" : "outline"}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm leading-6">
            {module.helperText}
          </p>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground text-xs">Status</span>
            <span className="truncate text-right font-medium text-xs">
              {previewLabel}
            </span>
          </div>
        </div>
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

function getModulePreviewLabel(family: FamilyDetail, module: DashboardModule) {
  if (module.segment === "money") {
    return family.defaultCurrency;
  }

  if (module.segment === "contributions") {
    return family.contributionCadence;
  }

  if (module.segment === "reports") {
    return canOpenModule(family, module) ? "Permissioned" : "Needs access";
  }

  return "Ready";
}
