"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DownloadIcon,
  FolderKanbanIcon,
  HammerIcon,
  HandCoinsIcon,
  ReceiptTextIcon,
  TargetIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { CreateProjectDialog } from "@/components/family/projects/create-project-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTHORITY_LABELS, hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";

type ProjectStatusFilter = "active" | "planned" | "completed" | "all";
type ProjectCategory =
  | "house"
  | "vehicle"
  | "education"
  | "business"
  | "event"
  | "other";
type MoneyMinorValue = number | string;

type ProjectsOverview = {
  currency?: string;
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    plannedMinorUnits?: MoneyMinorValue | null;
    contributedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    activeProjectCount?: number | null;
    overdueProjectCount?: number | null;
    contributorCount?: number | null;
  };
  projects?: ProjectRow[];
  contributions?: ProjectContributionRow[];
  updates?: ProjectUpdateRow[];
};

type ProjectRow = {
  id: string;
  name: string;
  category?: ProjectCategory | string | null;
  description?: string | null;
  targetAmountMinorUnits?: MoneyMinorValue | null;
  contributedMinorUnits?: MoneyMinorValue | null;
  outstandingMinorUnits?: MoneyMinorValue | null;
  percentFunded?: number | null;
  startDate?: string | null;
  targetDate?: string | null;
  status?: string | null;
  ownerName?: string | null;
  memberCount?: number | null;
  contributionStrategy?: string | null;
};

type ProjectContributionRow = {
  id: string;
  projectName: string;
  contributorName: string;
  amountMinorUnits?: MoneyMinorValue | null;
  paidAt?: string | null;
  status?: string | null;
};

type ProjectUpdateRow = {
  id: string;
  projectName: string;
  title: string;
  body?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      projects: ProjectsOverview | null;
      projectsMessage?: string;
    };

const statusLabels: Record<ProjectStatusFilter, string> = {
  active: "Active",
  planned: "Planned",
  completed: "Completed",
  all: "All projects",
};

const summarySkeletonKeys = [
  "planned",
  "contributed",
  "outstanding",
  "active",
  "overdue",
  "contributors",
];

export function FamilyProjectsWorkspace({
  familyName,
}: {
  familyName: string;
}) {
  const [status, setStatus] = useState<ProjectStatusFilter>("active");
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setState({ status: "loading" });
      }

      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!familyResponse.ok || !familyResponse.data) {
        setState({
          status: "error",
          message: familyResponse.message ?? "Unable to load this family.",
        });
        return;
      }

      const family = familyResponse.data;
      const search = new URLSearchParams({ status });
      const projectsResponse = await apiRequest<undefined, ProjectsOverview>(
        "get",
        `/families/${encodeURIComponent(family.id)}/projects/overview?${search}`,
      );

      setState({
        status: "success",
        family,
        projects: projectsResponse.ok
          ? normalizeProjectsOverview(projectsResponse.data)
          : null,
        projectsMessage: projectsResponse.ok
          ? undefined
          : (projectsResponse.message ??
            "Project records are not available from the API yet."),
      });
    },
    [familyName, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading") {
    return <FamilyProjectsSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanbanIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family projects could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ProjectsWorkspaceContent
      family={state.family}
      onProjectCreated={() => load({ silent: true })}
      onStatusChange={setStatus}
      projects={state.projects}
      projectsMessage={state.projectsMessage}
      status={status}
    />
  );
}

function ProjectsWorkspaceContent({
  family,
  onProjectCreated,
  onStatusChange,
  projects,
  projectsMessage,
  status,
}: {
  family: FamilyDetail;
  onProjectCreated: () => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  status: ProjectStatusFilter;
}) {
  const currency = projects?.currency ?? family.defaultCurrency;
  const hasSourceRecords = Boolean(
    projects && (projects.sourceRecordCount ?? 0) > 0,
  );
  const canManageProjects = hasCapability(family, "MANAGE_PROJECTS");
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");

  return (
    <div className="flex flex-col gap-6">
      <ProjectsHeader
        canExportReports={canExportReports}
        canManageProjects={canManageProjects}
        currency={currency}
        family={family}
        hasSourceRecords={hasSourceRecords}
        onProjectCreated={onProjectCreated}
      />
      <Separator />
      <ProjectFilters
        onStatusChange={onStatusChange}
        status={status}
        statusLabel={statusLabels[status]}
      />
      {projectsMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved project records</AlertTitle>
          <AlertDescription>
            This screen is ready for family plans such as buying a car, building
            a house, assigning members, and tracking contributions. Totals stay
            empty until the backend returns persisted project records. API
            detail: {projectsMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      <ProjectMetricCards currency={currency} projects={projects} />
      <Tabs defaultValue="projects" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="projects">
          <ProjectList currency={currency} projects={projects} />
        </TabsContent>
        <TabsContent value="contributions">
          <ProjectContributionTable currency={currency} projects={projects} />
        </TabsContent>
        <TabsContent value="updates">
          <ProjectUpdatesList projects={projects} />
        </TabsContent>
        <TabsContent value="operations">
          <ProjectOperationsGrid family={family} projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectsHeader({
  canExportReports,
  canManageProjects,
  currency,
  family,
  hasSourceRecords,
  onProjectCreated,
}: {
  canExportReports: boolean;
  canManageProjects: boolean;
  currency: string;
  family: FamilyDetail;
  hasSourceRecords: boolean;
  onProjectCreated: () => void;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Family projects
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Plan family goals such as building a house, buying a vehicle,
            funding education, or starting a business. Budgets, members,
            contribution progress, dates, and updates are shown from persisted
            project records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canManageProjects ? (
            <CreateProjectDialog
              currency={currency}
              family={family}
              onProjectCreated={onProjectCreated}
            />
          ) : null}
          {canExportReports ? (
            <Button size="sm" variant="outline">
              <DownloadIcon aria-hidden="true" data-icon="inline-start" />
              Export
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.name}</Badge>
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{currency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}

function ProjectFilters({
  onStatusChange,
  status,
  statusLabel,
}: {
  onStatusChange: (status: ProjectStatusFilter) => void;
  status: ProjectStatusFilter;
  statusLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <ClipboardListIcon
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-sm">Project status</p>
          <p className="text-muted-foreground text-xs">
            Current view: {statusLabel}
          </p>
        </div>
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as ProjectStatusFilter)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Project status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All projects</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </section>
  );
}

function ProjectMetricCards({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const totals = projects?.totals;
  const cards: {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
  }[] = [
    {
      title: "Planned budget",
      value: formatOptionalMoney(totals?.plannedMinorUnits, currency),
      description: "Approved target amounts across projects",
      icon: WalletCardsIcon,
    },
    {
      title: "Contributed",
      value: formatOptionalMoney(totals?.contributedMinorUnits, currency),
      description: "Verified project contributions received",
      icon: HandCoinsIcon,
    },
    {
      title: "Outstanding",
      value: formatOptionalMoney(totals?.outstandingMinorUnits, currency),
      description: "Remaining amount needed for open plans",
      icon: TargetIcon,
    },
    {
      title: "Active projects",
      value:
        typeof totals?.activeProjectCount === "number"
          ? totals.activeProjectCount.toLocaleString()
          : "No records",
      description: "Projects currently being worked on",
      icon: HammerIcon,
    },
    {
      title: "Past target date",
      value:
        typeof totals?.overdueProjectCount === "number"
          ? totals.overdueProjectCount.toLocaleString()
          : "No records",
      description: "Projects that need review or a new date",
      icon: CalendarClockIcon,
    },
    {
      title: "Contributors",
      value:
        typeof totals?.contributorCount === "number"
          ? totals.contributorCount.toLocaleString()
          : "No records",
      description: "Members who contributed to projects",
      icon: UsersRoundIcon,
    },
  ];

  return (
    <section
      aria-label="Family projects summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-xl">
                  {card.value}
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs leading-5">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function ProjectList({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const rows = projects?.projects ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project plans</CardTitle>
        <CardDescription>
          Family goals with budgets, dates, owners, members, and contribution
          progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length ? (
          rows.map((project) => (
            <article key={project.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-base">{project.name}</h2>
                    <StatusBadge value={project.status ?? "planned"} />
                    {project.category ? (
                      <Badge variant="outline">
                        {formatTitle(project.category)}
                      </Badge>
                    ) : null}
                  </div>
                  {project.description ? (
                    <p className="max-w-3xl text-muted-foreground text-sm leading-6">
                      {project.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge variant="secondary">
                    {project.ownerName ?? "No owner assigned"}
                  </Badge>
                  <Badge variant="outline">
                    {typeof project.memberCount === "number"
                      ? `${project.memberCount.toLocaleString()} members`
                      : "Members not set"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <ProjectFact
                  label="Target amount"
                  value={formatOptionalMoney(
                    project.targetAmountMinorUnits,
                    currency,
                  )}
                />
                <ProjectFact
                  label="Contributed"
                  value={formatOptionalMoney(
                    project.contributedMinorUnits,
                    currency,
                  )}
                />
                <ProjectFact
                  label="Target date"
                  value={formatDate(project.targetDate)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Progress value={clampPercent(project.percentFunded)} />
                <p className="text-muted-foreground text-xs">
                  {typeof project.percentFunded === "number"
                    ? `${Math.round(clampPercent(project.percentFunded))}% funded`
                    : "Funding percent must come from persisted records."}
                  {project.contributionStrategy
                    ? ` Contribution plan: ${formatTitle(project.contributionStrategy)}.`
                    : ""}
                </p>
              </div>
            </article>
          ))
        ) : (
          <TableEmptyState
            description="Saved plans such as buying a vehicle, building a house, education support, and family business projects will appear here."
            icon={FolderKanbanIcon}
            title="No project plans returned"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProjectContributionTable({
  currency,
  projects,
}: {
  currency: string;
  projects: ProjectsOverview | null;
}) {
  const contributions = projects?.contributions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project contributions</CardTitle>
        <CardDescription>
          Contributions linked to a family project and verified by the backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contributions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Contributor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell className="font-medium">
                    {contribution.projectName}
                  </TableCell>
                  <TableCell>{contribution.contributorName}</TableCell>
                  <TableCell>{formatDate(contribution.paidAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={contribution.status ?? "pending"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(
                      contribution.amountMinorUnits,
                      currency,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            description="Member payments and pledges connected to projects will show here once saved."
            icon={HandCoinsIcon}
            title="No project contributions returned"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProjectUpdatesList({
  projects,
}: {
  projects: ProjectsOverview | null;
}) {
  const updates = projects?.updates ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project updates</CardTitle>
        <CardDescription>
          Milestones, notes, and changes recorded against family projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {updates.length ? (
          updates.map((update) => (
            <article key={update.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{update.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {update.projectName}
                    {update.createdBy ? ` by ${update.createdBy}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{formatDate(update.createdAt)}</Badge>
              </div>
              {update.body ? (
                <p className="mt-3 text-muted-foreground text-sm leading-6">
                  {update.body}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <TableEmptyState
            description="Project milestones, documents, and progress notes will appear here."
            icon={ReceiptTextIcon}
            title="No project updates returned"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProjectOperationsGrid({
  family,
  projects,
}: {
  family: FamilyDetail;
  projects: ProjectsOverview | null;
}) {
  const items: {
    title: string;
    description: string;
    value: string;
    icon: LucideIcon;
  }[] = [
    {
      title: "Family members",
      description: "People available to assign to project work.",
      value: family.memberCount.toLocaleString(),
      icon: UsersRoundIcon,
    },
    {
      title: "Report source",
      description: "Reports must come from persisted project records.",
      value: `${projects?.sourceRecordCount ?? 0} records`,
      icon: CheckCircle2Icon,
    },
    {
      title: "Contribution cadence",
      description: "Default family cadence for planned collections.",
      value: family.contributionCadence,
      icon: CalendarClockIcon,
    },
    {
      title: "Project permission",
      description: "Backend must enforce manage-project actions.",
      value: hasCapability(family, "MANAGE_PROJECTS") ? "Allowed" : "View only",
      icon: FolderKanbanIcon,
    },
  ];

  return (
    <section
      aria-label="Project operations"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl tracking-tight">
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function ProjectFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <Badge variant="outline">{formatTitle(value)}</Badge>;
}

function TableEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

function FamilyProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-3xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summarySkeletonKeys.map((key) => (
          <Skeleton className="h-36 w-full" key={key} />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function normalizeProjectsOverview(
  projects?: ProjectsOverview,
): ProjectsOverview | null {
  if (!projects) {
    return null;
  }

  return {
    ...projects,
    projects: Array.isArray(projects.projects) ? projects.projects : [],
    contributions: Array.isArray(projects.contributions)
      ? projects.contributions
      : [],
    updates: Array.isArray(projects.updates) ? projects.updates : [],
  };
}

function formatOptionalMoney(
  value: MoneyMinorValue | null | undefined,
  currency: string,
) {
  if (value === null || value === undefined) {
    return "No records";
  }

  return formatMinorUnits(value, currency);
}

function formatMinorUnits(value: unknown, currency: string) {
  const normalized = normalizeMinorUnitString(value);

  if (!normalized) {
    return `${currency} ${String(value)}`;
  }

  const digits = getCurrencyFractionDigits(currency);
  const negative = normalized.startsWith("-");
  const absolute = negative ? normalized.slice(1) : normalized;

  if (digits === 0) {
    return `${negative ? "-" : ""}${currency} ${groupDigits(absolute)}`;
  }

  const padded = absolute.padStart(digits + 1, "0");
  const major = padded.slice(0, -digits);
  const minor = padded.slice(-digits);

  return `${negative ? "-" : ""}${currency} ${groupDigits(major)}.${minor}`;
}

function normalizeMinorUnitString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return value;
  }

  return null;
}

function getCurrencyFractionDigits(currency: string) {
  try {
    const maximumFractionDigits = new Intl.NumberFormat("en", {
      currency,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;

    return typeof maximumFractionDigits === "number"
      ? maximumFractionDigits
      : 2;
  } catch {
    return 2;
  }
}

function groupDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function formatTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not dated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
