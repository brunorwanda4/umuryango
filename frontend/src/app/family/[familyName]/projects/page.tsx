import type { FamilyDetail } from "@/components/family/dashboard/types";
import { FamilyProjectsWorkspace } from "@/components/family/projects/family-projects-workspace";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { serverApiRequest } from "@/service/server-api";

async function getProjectsPageData(familyName: string) {
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
    `/families/${encodeURIComponent(family.id)}/projects/overview?status=active`,
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

export default async function FamilyProjectsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const initialData = await getProjectsPageData(familyName);

  return (
    <FamilyProjectsWorkspace
      familyName={familyName}
      initialData={initialData}
    />
  );
}
