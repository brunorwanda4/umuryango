import { FamilyContributionsWorkspace } from "@/components/family/contributions/family-contributions-workspace";

export default async function FamilyContributionsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyContributionsWorkspace familyName={familyName} />;
}
