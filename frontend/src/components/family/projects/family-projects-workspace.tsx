"use client";

import { AlertCircleIcon, DownloadIcon, FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/common/pages/page-title";
import {
  filterSharedPlans,
  PlanList,
  PlanPageSkeleton,
  PlanSegmentedFilters,
  PlanSummaryHero,
  type SharedPlanFilterTab,
} from "@/components/common/plans";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS, hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { CreateProjectDialog } from "./create-project-dialog";
import {
  adaptFamilyProjectsSummary,
  adaptFamilyProjectToSharedItem,
} from "./family-projects-adapter";
import { ProjectContributionTable } from "./project-contribution-table";
import { ProjectOperationsGrid } from "./project-operations-grid";
import type {
  FetchState,
  ProjectStatusFilter,
  ProjectsOverview,
} from "./types";
import { normalizeProjectsOverview } from "./utils";

const t = createTranslator("FamilyProjects");
const tCommon = createTranslator("Common");
const tDashboard = createTranslator("FamilyDashboard");
const tShared = createTranslator("SharedPlans");

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
    return <PlanPageSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderKanbanIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t((m) => m.FamilyProjects.loadErrorTitle)}</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists.{" "}
            <Link href="/family">
              {tDashboard((m) => m.FamilyDashboard.backToFamilies)}
            </Link>
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
  const canManageProjects = hasCapability(family, "MANAGE_PROJECTS");
  const canExportReports = hasCapability(family, "EXPORT_REPORTS");

  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => {
    return adaptFamilyProjectsSummary(projects, currency);
  }, [projects, currency]);

  const sharedItems = useMemo(() => {
    const rawProjects = projects?.projects || [];
    return rawProjects.map((p) =>
      adaptFamilyProjectToSharedItem(p, familyName, currency),
    );
  }, [projects?.projects, familyName, currency]);

  const statusTabs: SharedPlanFilterTab[] = useMemo(() => {
    return [
      {
        id: "active",
        label: tShared((m) => m.SharedPlans.activeTab),
      },
      {
        id: "planned",
        label: tShared((m) => m.SharedPlans.plannedTab),
      },
      {
        id: "completed",
        label: tShared((m) => m.SharedPlans.completedTab),
      },
      {
        id: "all",
        label: tShared((m) => m.SharedPlans.allProjectsTab),
      },
    ];
  }, []);

  const filteredItems = useMemo(() => {
    return filterSharedPlans(sharedItems, "all", searchQuery);
  }, [sharedItems, searchQuery]);

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full min-w-0">
      <PageTitle
        title={t((m) => m.FamilyProjects.title)}
        description={tShared((m) => m.SharedPlans.familySubtitle)}
        badge={AUTHORITY_LABELS[family.authority]}
        actions={
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                {tCommon((m) => m.Common.export)}
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Hero Summary Card */}
      <PlanSummaryHero summary={summary} isPersonal={false} />

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

      {/* Workspace Tabs */}
      <Tabs defaultValue="projects" className="gap-4">
        <div className="overflow-x-auto no-scrollbar">
          <TabsList className="min-w-max">
            <TabsTrigger value="projects">
              {t((m) => m.FamilyProjects.projectsTab)}
            </TabsTrigger>
            <TabsTrigger value="contributions">
              {t((m) => m.FamilyProjects.contributionsTab)}
            </TabsTrigger>
            <TabsTrigger value="operations">
              {t((m) => m.FamilyProjects.operationsTab)}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="projects" className="space-y-4">
          <PlanSegmentedFilters
            tabs={statusTabs}
            activeTab={status}
            onTabChange={(newStatus) =>
              onStatusChange(newStatus as ProjectStatusFilter)
            }
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <PlanList
            items={filteredItems}
            hasPlans={sharedItems.length > 0}
            onResetFilters={() => {
              onStatusChange("active");
              setSearchQuery("");
            }}
            isPersonal={false}
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
