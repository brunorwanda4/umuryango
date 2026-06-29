import { FamilyProjectsWorkspace } from "@/components/family/projects/family-projects-workspace";

export default async function FamilyProjectsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyProjectsWorkspace familyName={familyName} />;
}
