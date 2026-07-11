"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import type { FamilyDetail } from "@/components/family/dashboard/types";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { FamilyProjectsSkeleton } from "./family-projects-skeleton";
import { ProjectContributionTable } from "./project-contribution-table";
import {
  ProjectFact,
  StatusBadge,
  TableEmptyState,
} from "./projects-ui-helpers";
import type {
  ProjectContributionRow,
  ProjectRow,
  ProjectsOverview,
  ProjectUpdateRow,
} from "./types";
import {
  clampPercent,
  findProjectByRouteSlug,
  formatDate,
  formatTitle,
  normalizeProjectsOverview,
} from "./utils";

type ProjectDetailFetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      projects: ProjectsOverview | null;
      projectsMessage?: string;
    };

export type ProjectDetailWorkspaceInitialData = {
  family: FamilyDetail | null;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  error: string | null;
};

export function ProjectDetailWorkspace({
  familyName,
  projectName,
  initialData,
}: {
  familyName: string;
  projectName: string;
  initialData?: ProjectDetailWorkspaceInitialData;
}) {
  const [state, setState] = useState<ProjectDetailFetchState>(
    initialData?.family
      ? {
          status: "success",
          family: initialData.family,
          projects: initialData.projects
            ? normalizeProjectsOverview(initialData.projects)
            : null,
          projectsMessage: initialData.projectsMessage,
        }
      : { status: "loading" },
  );

  const load = useCallback(async () => {
    setState({ status: "loading" });

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
    const search = new URLSearchParams({ status: "all" });
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
  }, [familyName]);

  useEffect(() => {
    if (!initialData) {
      load();
    }
  }, [load, initialData]);

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
          <EmptyTitle>Project details could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ProjectDetailContent
      family={state.family}
      familyName={familyName}
      projects={state.projects}
      projectsMessage={state.projectsMessage}
      projectName={projectName}
    />
  );
}

function ProjectDetailContent({
  family,
  familyName,
  projects,
  projectsMessage,
  projectName,
}: {
  family: FamilyDetail;
  familyName: string;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  projectName: string;
}) {
  const project = useMemo(
    () => findProjectByRouteSlug(projects?.projects ?? [], projectName),
    [projects, projectName],
  );
  const currency = projects?.currency ?? family.defaultCurrency;

  if (!projects) {
    return (
      <ProjectRecordsUnavailable
        familyName={familyName}
        message={projectsMessage}
      />
    );
  }

  if (!project) {
    return (
      <ProjectNotFound
        familyName={familyName}
        projectName={projectName}
        projects={projects}
      />
    );
  }

  const contributions = scopeProjectContributions(
    projects.contributions ?? [],
    project,
  );
  const updates = scopeProjectUpdates(projects.updates ?? [], project);
  const scopedProjects: ProjectsOverview = {
    ...projects,
    projects: [project],
    contributions,
    updates,
    sourceRecordCount: 1 + contributions.length + updates.length,
  };
  const canManageProjects = hasCapability(family, "MANAGE_PROJECTS");
  const canManageContributions = hasCapability(family, "MANAGE_CONTRIBUTIONS");

  return (
    <div className="flex flex-col gap-6">
      <ProjectDetailHeader
        canManageContributions={canManageContributions}
        familyName={familyName}
        project={project}
        sourceRecordCount={scopedProjects.sourceRecordCount ?? 0}
      />
      <Separator />
      {projectsMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved project records</AlertTitle>
          <AlertDescription>
            This page only shows project money, contributions, and updates when
            the backend returns persisted records. API detail: {projectsMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      <ProjectDetailMetrics currency={currency} project={project} />
      <ProjectProgressCard currency={currency} project={project} />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview">
          <ProjectManagementOverview
            canManageProjects={canManageProjects}
            family={family}
            project={project}
            sourceRecordCount={scopedProjects.sourceRecordCount ?? 0}
          />
        </TabsContent>
        <TabsContent value="contributions">
          <ProjectContributionSection
            canManageContributions={canManageContributions}
            currency={currency}
            projects={scopedProjects}
          />
        </TabsContent>
        <TabsContent value="plan">
          <ProjectPlanSection family={family} project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectDetailHeader({
  canManageContributions,
  familyName,
  project,
  sourceRecordCount,
}: {
  canManageContributions: boolean;
  familyName: string;
  project: ProjectRow;
  sourceRecordCount: number;
}) {
  return (
    <header className="flex flex-col gap-4">
      <Button asChild className="w-fit" size="sm" variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Projects
        </Link>
      </Button>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              {project.name}
            </h1>
            <StatusBadge value={project.status ?? "planned"} />
            {project.category ? (
              <Badge variant="outline">{formatTitle(project.category)}</Badge>
            ) : null}
            <Badge variant={sourceRecordCount > 1 ? "outline" : "secondary"}>
              {sourceRecordCount.toLocaleString()} source records
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            {project.description ??
              "Manage the project plan, target date, contribution progress, responsible members, and updates from saved family records."}
          </p>
        </div>
        {canManageContributions ? (
          <Button
            disabled
            size="sm"
            title="Contribution recording endpoint is not available yet."
          >
            <HandCoinsIcon aria-hidden="true" data-icon="inline-start" />
            Record contribution
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function ProjectDetailMetrics({
  currency,
  project,
}: {
  currency: string;
  project: ProjectRow;
}) {
  const cards = [
    {
      title: "Target amount",
      value: project.targetAmountMinorUnits,
      description: "Saved project budget target",
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: "Contributed",
      value: project.contributedMinorUnits,
      description: "Verified contributions received",
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: "Outstanding",
      value: project.outstandingMinorUnits,
      description: "Remaining amount from persisted records",
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: "Target date",
      value: formatDate(project.targetDate),
      description: getTargetDateDescription(project),
      icon: CalendarClockIcon,
    },
  ];

  return (
    <section
      aria-label="Project financial summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-xl">
                  {card.isMoney ? (
                    <CompactMoney
                      currency={currency}
                      emptyLabel="No records"
                      value={card.value}
                    />
                  ) : (
                    card.value
                  )}
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

function ProjectProgressCard({
  currency,
  project,
}: {
  currency: string;
  project: ProjectRow;
}) {
  const progress = clampPercent(project.percentFunded);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project progress</CardTitle>
        <CardDescription>
          Funding, dates, owner, and contribution strategy for this project.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Funding progress</span>
            <span className="text-muted-foreground">
              {typeof project.percentFunded === "number"
                ? `${Math.round(progress)}%`
                : "No percentage"}
            </span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ProjectFact
            label="Contributed"
            value={
              <CompactMoney
                currency={currency}
                emptyLabel="No records"
                value={project.contributedMinorUnits}
              />
            }
          />
          <ProjectFact
            label="Start date"
            value={formatDate(project.startDate)}
          />
          <ProjectFact
            label="Target date"
            value={formatDate(project.targetDate)}
          />
          <ProjectFact
            label="Responsible member"
            value={project.ownerName ?? "No owner assigned"}
          />
          <ProjectFact
            label="Participants"
            value={
              typeof project.memberCount === "number"
                ? `${project.memberCount.toLocaleString()} members`
                : "Members not set"
            }
          />
          <ProjectFact
            label="Contribution plan"
            value={
              project.contributionStrategy
                ? formatTitle(project.contributionStrategy)
                : "Not set"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectManagementOverview({
  canManageProjects,
  family,
  project,
  sourceRecordCount,
}: {
  canManageProjects: boolean;
  family: FamilyDetail;
  project: ProjectRow;
  sourceRecordCount: number;
}) {
  const items = [
    {
      title: "Project manager",
      description: "Responsible person for follow-up and records.",
      value: project.ownerName ?? "Not assigned",
      icon: UsersRoundIcon,
    },
    {
      title: "Family cadence",
      description: "Default collection rhythm for planned contributions.",
      value: family.contributionCadence,
      icon: CalendarClockIcon,
    },
    {
      title: "Project permission",
      description: "Backend must enforce manage-project changes.",
      value: canManageProjects ? "Allowed" : "View only",
      icon: ShieldCheckIcon,
    },
    {
      title: "Report source",
      description: "Project reports should use persisted records only.",
      value: `${sourceRecordCount.toLocaleString()} records`,
      icon: CheckCircle2Icon,
    },
  ];

  return (
    <section
      aria-label="Project management overview"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <ProjectOperationCard key={item.title} {...item} />
      ))}
    </section>
  );
}

function ProjectContributionSection({
  canManageContributions,
  currency,
  projects,
}: {
  canManageContributions: boolean;
  currency: string;
  projects: ProjectsOverview;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>
          {canManageContributions
            ? "Contribution entry is read-only for now"
            : "Contribution entry requires permission"}
        </AlertTitle>
        <AlertDescription>
          Verified contribution rows below come from saved backend records.
          Recording a new project contribution needs a dedicated backend
          mutation with authorization, idempotency, and audit logging.
        </AlertDescription>
      </Alert>
      <ProjectContributionTable currency={currency} projects={projects} />
    </div>
  );
}

function ProjectPlanSection({
  family,
  project,
}: {
  family: FamilyDetail;
  project: ProjectRow;
}) {
  const checklist = [
    {
      title: "Confirm budget and rules",
      description:
        "Keep the target amount, approval rules, and contribution strategy clear before collecting money.",
      status: project.targetAmountMinorUnits ? "Ready" : "Needs amount",
    },
    {
      title: "Assign responsible members",
      description:
        "Choose who follows construction, purchases, suppliers, receipts, and family updates.",
      status: project.ownerName ? "Assigned" : "Needs owner",
    },
    {
      title: "Collect project contributions",
      description:
        "Every payment should be saved as a project contribution before totals change.",
      status: project.contributionStrategy
        ? formatTitle(project.contributionStrategy)
        : "Needs plan",
    },
    {
      title: "Keep documents attached",
      description:
        "Receipts, contracts, land documents, and supplier records should stay linked to the project.",
      status: "Document workflow",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>Planning checklist</CardTitle>
          <CardDescription>
            Practical steps for keeping this project organized and auditable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {checklist.map((item) => (
            <div
              className="flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between"
              key={item.title}
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <ClipboardListIcon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    {item.description}
                  </p>
                </div>
              </div>
              <Badge className="w-fit" variant="outline">
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardAction>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardAction>
          <CardTitle>Project file</CardTitle>
          <CardDescription>
            Documents and approvals should remain tied to this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ProjectFact label="Family" value={family.name} />
          <ProjectFact
            label="Target date"
            value={formatDate(project.targetDate)}
          />
          <ProjectFact
            label="Status"
            value={formatTitle(project.status ?? "planned")}
          />
          <TableEmptyState
            description="Linked receipts, contracts, agreements, and project reports will appear here when the document API returns project attachments."
            icon={FileTextIcon}
            title="No linked documents returned"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectOperationCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-2xl tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProjectRecordsUnavailable({
  familyName,
  message,
}: {
  familyName: string;
  message?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanbanIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Project records are not available</EmptyTitle>
        <EmptyDescription>
          This detail page needs saved project records from the backend before
          it can show budgets, contributions, and planning history.
          {message ? ` API detail: ${message}` : ""}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          Back to projects
        </Link>
      </Button>
    </Empty>
  );
}

function ProjectNotFound({
  familyName,
  projectName,
  projects,
}: {
  familyName: string;
  projectName: string;
  projects: ProjectsOverview;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanbanIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Project not found</EmptyTitle>
        <EmptyDescription>
          No saved project matched "{formatTitle(projectName)}" in this family.
          {projects.projects?.length
            ? " Open the projects list and choose one of the saved project names."
            : " No saved projects were returned by the API."}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          Back to projects
        </Link>
      </Button>
    </Empty>
  );
}

function scopeProjectContributions(
  contributions: ProjectContributionRow[],
  project: ProjectRow,
) {
  return contributions.filter(
    (contribution) =>
      contribution.projectId === project.id ||
      (!contribution.projectId && contribution.projectName === project.name),
  );
}

function scopeProjectUpdates(updates: ProjectUpdateRow[], project: ProjectRow) {
  return updates.filter(
    (update) =>
      update.projectId === project.id ||
      (!update.projectId && update.projectName === project.name),
  );
}

function getTargetDateDescription(project: ProjectRow) {
  if (!project.targetDate) {
    return "No target date returned";
  }

  const status = project.status?.toLowerCase();

  if (status === "completed") {
    return "Project marked completed";
  }

  const targetDate = new Date(project.targetDate);

  if (Number.isNaN(targetDate.getTime())) {
    return "Invalid target date";
  }

  return targetDate < new Date()
    ? "Needs review or a new date"
    : "Upcoming project milestone";
}
