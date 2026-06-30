import { FamilyReportsWorkspace } from "@/components/family/reports/family-reports-workspace";

export default async function FamilyReportsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyReportsWorkspace familyName={familyName} />;
}
