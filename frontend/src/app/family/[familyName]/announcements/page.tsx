export default async function FamilyAnnouncementsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family announcements page for {familyName}</div>;
}
