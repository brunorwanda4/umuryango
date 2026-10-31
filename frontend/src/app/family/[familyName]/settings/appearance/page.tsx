import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilyAppearanceSettingsPage({
  params,
}: PageProps<"/family/[familyName]/settings/appearance">) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} page="appearance" />;
}
