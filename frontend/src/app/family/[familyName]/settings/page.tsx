import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilySettingsPage({
  params,
}: PageProps<"/family/[familyName]/settings">) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} />;
}
