import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilyGeneralSettingsPage({
  params,
}: PageProps<"/family/[familyName]/settings/general">) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} page="general" />;
}
