"use client";

import { AlertCircleIcon, DownloadIcon, FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS, hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { CreateProjectDialog } from "./create-project-dialog";
import { FamilyProjectsSkeleton } from "./family-projects-skeleton";
import { ProjectContributionTable } from "./project-contribution-table";
import { ProjectFilters } from "./project-filters";
import { ProjectList } from "./project-list";
import { ProjectMetricCards } from "./project-metric-cards";
import { ProjectOperationsGrid } from "./project-operations-grid";
import type {
  FetchState,
  ProjectStatusFilter,
  ProjectsOverview,
} from "./types";
import { normalizeProjectsOverview, statusLabels } from "./utils";

const t = createTranslator("FamilyProjects");
const tCommon = createTranslator("Common");
const tDashboard = createTranslator("FamilyDashboard");

export type FamilyProjectsWorkspaceInitialData = {
  family: FamilyDetail | null;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  error: string | null;
};

export function FamilyProjectsWorkspace({
  familyName,
  initialData,
}: {
  familyName: string;
  initialData?: FamilyProjectsWorkspaceInitialData;
}) {
  const [status, setStatus] = useState<ProjectStatusFilter>("active");
  const [state, setState] = useState<FetchState>(
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
  const [isFirstMount, setIsFirstMount] = useState(true);

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
    if (initialData && isFirstMount && status === "active") {
      setIsFirstMount(false);
      return;
    }
    load();
  }, [load, initialData, isFirstMount, status]);

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
          <EmptyTitle>{t("loadErrorTitle")}</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists.{" "}
            <Link href="/family">{tDashboard("backToFamilies")}</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ProjectsWorkspaceContent
      family={state.family}
      familyName={familyName}
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
  familyName,
  onProjectCreated,
  onStatusChange,
  projects,
  projectsMessage,
  status,
}: {
  family: FamilyDetail;
  familyName: string;
  onProjectCreated: () => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
  projects: ProjectsOverview | null;
  projectsMessage?: string;
  status: ProjectStatusFilter;
}) {
  const currency = projects?.currency ?? family.defaultCurrency;
  const _hasSourceRecords = Boolean(
    projects && (projects.sourceRecordCount ?? 0) > 0,
  );
  const canManageProjects = hasCapability(family, "MANAGE_PROJECTS");
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={t("title")}
        badge={AUTHORITY_LABELS[family.authority]}
        actions={
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
                {tCommon("export")}
              </Button>
            ) : null}
          </div>
        }
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
          <AlertTitle>{t("waitingForRecordsTitle")}</AlertTitle>
          <AlertDescription>
            {t("waitingForRecordsDesc", { detail: projectsMessage })}
          </AlertDescription>
        </Alert>
      ) : null}
      <ProjectMetricCards currency={currency} projects={projects} />
      <Tabs defaultValue="projects" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="projects">{t("projectsTab")}</TabsTrigger>
            <TabsTrigger value="contributions">
              {t("contributionsTab")}
            </TabsTrigger>
            <TabsTrigger value="operations">{t("operationsTab")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="projects">
          <ProjectList
            currency={currency}
            familyName={familyName}
            projects={projects}
          />
        </TabsContent>
        <TabsContent value="contributions">
          <ProjectContributionTable currency={currency} projects={projects} />
        </TabsContent>
        <TabsContent value="operations">
          <ProjectOperationsGrid family={family} projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
