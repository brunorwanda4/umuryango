import { FamilySettings } from "@/components/family/family-settings";

export default async function FamilyMemberAccessSettingsPage({
  params,
}: PageProps<"/family/[familyName]/settings/members">) {
  const { familyName } = await params;

  return <FamilySettings familySlug={familyName} page="members" />;
}
