import type { FamilyDetail } from "@/components/family/dashboard/types";
import { ProjectDetailWorkspace } from "@/components/family/projects/project-detail-workspace";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { serverApiRequest } from "@/service/server-api";

async function getProjectDetailPageData(familyName: string) {
  const familyResponse = await serverApiRequest<undefined, FamilyDetail>(
    "get",
    `/families/${encodeURIComponent(familyName)}`,
    undefined,
    { cache: "no-store" },
  );

  if (!familyResponse.ok || !familyResponse.data) {
    return {
      family: null,
      projects: null,
      projectsMessage: familyResponse.message ?? "Failed to load family.",
      error: familyResponse.message ?? "Failed to load family.",
    };
  }

  const family = familyResponse.data;
  const projectsResponse = await serverApiRequest<undefined, ProjectsOverview>(
    "get",
    `/families/${encodeURIComponent(family.id)}/projects/overview?status=all`,
    undefined,
    { cache: "no-store" },
  );

  return {
    family,
    projects: projectsResponse.ok ? (projectsResponse.data ?? null) : null,
    projectsMessage: projectsResponse.ok
      ? undefined
      : (projectsResponse.message ??
        "Project records are not available from the API yet."),
    error: null,
  };
}

export default async function FamilyProjectDetailPage({
  params,
}: {
  params: Promise<{ familyName: string; projectName: string }>;
}) {
  const { familyName, projectName } = await params;
  const initialData = await getProjectDetailPageData(familyName);

  return (
    <ProjectDetailWorkspace
      familyName={familyName}
      projectName={projectName}
      initialData={initialData}
    />
  );
}
