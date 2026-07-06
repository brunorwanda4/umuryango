import { ProjectDetailWorkspace } from "@/components/family/projects/project-detail-workspace";

export default async function FamilyProjectDetailPage({
  params,
}: {
  params: Promise<{ familyName: string; projectName: string }>;
}) {
  const { familyName, projectName } = await params;

  return (
    <ProjectDetailWorkspace familyName={familyName} projectName={projectName} />
  );
}
