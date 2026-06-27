export default async function FamilySettingsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family settings page for {familyName}</div>;
}
