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
import { createTranslator, type Translator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyProjects");
  const _tCommon = createTranslator("Common");
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
        message:
          familyResponse.message ??
          t((m) => m.FamilyProjects.detailsUnavailableTitle),
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
          t((m) => m.FamilyProjects.projectRecordsUnavailableDesc)),
    });
  }, [familyName, t]);

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
          <EmptyTitle>
            {t((m) => m.FamilyProjects.detailsUnavailableTitle)}
          </EmptyTitle>
          <EmptyDescription>
            {t((m) => m.FamilyProjects.detailsUnavailableDesc, {
              message: state.message,
            })}{" "}
            <Link href="/family">
              {t((m) => m.FamilyProjects.backToFamilies)}
            </Link>
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
  const t = createTranslator("FamilyProjects");
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
          <AlertTitle>
            {t((m) => m.FamilyProjects.waitingForRecordsTitle)}
          </AlertTitle>
          <AlertDescription>
            {t((m) => m.FamilyProjects.waitingForRecordsDesc, {
              detail: projectsMessage,
            })}
          </AlertDescription>
        </Alert>
      ) : null}
      <ProjectDetailMetrics currency={currency} project={project} />
      <ProjectProgressCard currency={currency} project={project} />
      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="overview">
              {t((m) => m.FamilyProjects.overviewTab)}
            </TabsTrigger>
            <TabsTrigger value="contributions">
              {t((m) => m.FamilyProjects.contributionsTab)}
            </TabsTrigger>
            <TabsTrigger value="plan">
              {t((m) => m.FamilyProjects.planTab)}
            </TabsTrigger>
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
  const t = createTranslator("FamilyProjects");
  return (
    <header className="flex flex-col gap-4">
      <Button asChild className="w-fit" size="sm" variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          {t((m) => m.FamilyProjects.projectsButton)}
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
              {t((m) => m.FamilyProjects.sourceRecordsBadge, {
                count: sourceRecordCount,
              })}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            {project.description ??
              t((m) => m.FamilyProjects.defaultProjectDescription)}
          </p>
        </div>
        {canManageContributions ? (
          <Button
            disabled
            size="sm"
            title={t((m) => m.FamilyProjects.recordContributionDisabledTitle)}
          >
            <HandCoinsIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyProjects.recordContribution)}
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
  const t = createTranslator("FamilyProjects");
  const cards = [
    {
      title: t((m) => m.FamilyProjects.targetBudget),
      value: project.targetAmountMinorUnits,
      description: t((m) => m.FamilyProjects.savedProjectBudgetTarget),
      icon: WalletCardsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.contributed),
      value: project.contributedMinorUnits,
      description: t((m) => m.FamilyProjects.verifiedContributionsReceived),
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.outstanding),
      value: project.outstandingMinorUnits,
      description: t((m) => m.FamilyProjects.remainingFromPersistedRecords),
      icon: TargetIcon,
      isMoney: true,
    },
    {
      title: t((m) => m.FamilyProjects.targetDate),
      value: formatDate(project.targetDate),
      description: getTargetDateDescription(project, t),
      icon: CalendarClockIcon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyProjects.projectFinancialSummaryAria)}
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
  const t = createTranslator("FamilyProjects");
  const progress = clampPercent(project.percentFunded);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t((m) => m.FamilyProjects.projectProgressTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyProjects.projectProgressDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">
              {t((m) => m.FamilyProjects.fundingProgress)}
            </span>
            <span className="text-muted-foreground">
              {typeof project.percentFunded === "number"
                ? `${Math.round(progress)}%`
                : t((m) => m.FamilyProjects.noPercentage)}
            </span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ProjectFact
            label={t((m) => m.FamilyProjects.contributed)}
            value={
              <CompactMoney
                currency={currency}
                emptyLabel="No records"
                value={project.contributedMinorUnits}
              />
            }
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.startDate)}
            value={formatDate(project.startDate)}
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.targetDate)}
            value={formatDate(project.targetDate)}
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.responsibleMember)}
            value={
              project.ownerName ?? t((m) => m.FamilyProjects.noOwnerAssigned)
            }
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.participants)}
            value={
              typeof project.memberCount === "number"
                ? t((m) => m.FamilyProjects.membersCount, {
                    count: project.memberCount,
                  })
                : t((m) => m.FamilyProjects.membersNotSet)
            }
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.contributionPlanLabel)}
            value={
              project.contributionStrategy
                ? formatTitle(project.contributionStrategy)
                : t((m) => m.FamilyProjects.notSet)
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
  const t = createTranslator("FamilyProjects");
  const items = [
    {
      title: t((m) => m.FamilyProjects.projectManager),
      description: t((m) => m.FamilyProjects.projectManagerDesc),
      value: project.ownerName ?? t((m) => m.FamilyProjects.notAssigned),
      icon: UsersRoundIcon,
    },
    {
      title: t((m) => m.FamilyProjects.familyCadence),
      description: t((m) => m.FamilyProjects.familyCadenceDesc),
      value: family.contributionCadence,
      icon: CalendarClockIcon,
    },
    {
      title: t((m) => m.FamilyProjects.projectPermission),
      description: t((m) => m.FamilyProjects.projectPermissionDesc),
      value: canManageProjects
        ? t((m) => m.FamilyProjects.permissionAllowed)
        : t((m) => m.FamilyProjects.permissionViewOnly),
      icon: ShieldCheckIcon,
    },
    {
      title: t((m) => m.FamilyProjects.reportSource),
      description: t((m) => m.FamilyProjects.reportSourceDesc),
      value: t((m) => m.FamilyProjects.recordsCount, {
        count: sourceRecordCount,
      }),
      icon: CheckCircle2Icon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyProjects.operationsAria)}
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
  const t = createTranslator("FamilyProjects");
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>
          {canManageContributions
            ? t((m) => m.FamilyProjects.contributionEntryReadOnly)
            : t((m) => m.FamilyProjects.contributionEntryRequiresPermission)}
        </AlertTitle>
        <AlertDescription>
          {t((m) => m.FamilyProjects.contributionAlertDesc)}
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
  const t = createTranslator("FamilyProjects");
  const checklist = [
    {
      title: t((m) => m.FamilyProjects.confirmBudgetRules),
      description: t((m) => m.FamilyProjects.confirmBudgetRulesDesc),
      status: project.targetAmountMinorUnits
        ? t((m) => m.FamilyProjects.ready)
        : t((m) => m.FamilyProjects.needsAmount),
    },
    {
      title: t((m) => m.FamilyProjects.assignResponsibleMembers),
      description: t((m) => m.FamilyProjects.assignResponsibleMembersDesc),
      status: project.ownerName
        ? t((m) => m.FamilyProjects.assigned)
        : t((m) => m.FamilyProjects.needsOwner),
    },
    {
      title: t((m) => m.FamilyProjects.collectProjectContributions),
      description: t((m) => m.FamilyProjects.collectProjectContributionsDesc),
      status: project.contributionStrategy
        ? formatTitle(project.contributionStrategy)
        : t((m) => m.FamilyProjects.needsPlan),
    },
    {
      title: t((m) => m.FamilyProjects.keepDocumentsAttached),
      description: t((m) => m.FamilyProjects.keepDocumentsAttachedDesc),
      status: t((m) => m.FamilyProjects.documentWorkflow),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>{t((m) => m.FamilyProjects.planningChecklist)}</CardTitle>
          <CardDescription>
            {t((m) => m.FamilyProjects.planningChecklistDesc)}
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
          <CardTitle>{t((m) => m.FamilyProjects.projectFile)}</CardTitle>
          <CardDescription>
            {t((m) => m.FamilyProjects.projectFileDesc)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ProjectFact
            label={t((m) => m.FamilyProjects.familyLabel)}
            value={family.name}
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.targetDate)}
            value={formatDate(project.targetDate)}
          />
          <ProjectFact
            label={t((m) => m.FamilyProjects.projectStatus)}
            value={formatTitle(project.status ?? "planned")}
          />
          <TableEmptyState
            description={t((m) => m.FamilyProjects.noLinkedDocsDesc)}
            icon={FileTextIcon}
            title={t((m) => m.FamilyProjects.noLinkedDocsReturned)}
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
  const t = createTranslator("FamilyProjects");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanbanIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {t((m) => m.FamilyProjects.projectRecordsUnavailable)}
        </EmptyTitle>
        <EmptyDescription>
          {t((m) => m.FamilyProjects.projectRecordsUnavailableDesc)}
          {message ? ` API detail: ${message}` : ""}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          {t((m) => m.FamilyProjects.backToProjects)}
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
  const t = createTranslator("FamilyProjects");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderKanbanIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t((m) => m.FamilyProjects.projectNotFound)}</EmptyTitle>
        <EmptyDescription>
          {t((m) => m.FamilyProjects.projectNotFoundMatched, {
            projectName: formatTitle(projectName),
          })}
          {projects.projects?.length
            ? ` ${t((m) => m.FamilyProjects.openProjectsList)}`
            : ` ${t((m) => m.FamilyProjects.noSavedProjectsReturned)}`}
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild variant="outline">
        <Link href={`/family/${encodeURIComponent(familyName)}/projects`}>
          {t((m) => m.FamilyProjects.backToProjects)}
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

function getTargetDateDescription(project: ProjectRow, t: Translator) {
  if (!project.targetDate) {
    return t((m) => m.FamilyProjects.noTargetDate);
  }

  const status = project.status?.toLowerCase();

  if (status === "completed") {
    return t((m) => m.FamilyProjects.projectMarkedCompleted);
  }

  const targetDate = new Date(project.targetDate);

  if (Number.isNaN(targetDate.getTime())) {
    return t((m) => m.FamilyProjects.invalidTargetDate);
  }

  return targetDate < new Date()
    ? t((m) => m.FamilyProjects.needsReviewOrNewDate)
    : t((m) => m.FamilyProjects.upcomingMilestone);
}
