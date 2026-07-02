import { FamilyContactsPage } from "@/components/family/contacts/family-contacts-page";

export default async function FamilyContactsRoute({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyContactsPage familyName={familyName} />;
}
