import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilyAuditSettingsPage({
  params,
}: PageProps<"/family/[familyName]/settings/audit">) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} page="audit" />;
}
