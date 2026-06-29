import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilySettingsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} />;
}
