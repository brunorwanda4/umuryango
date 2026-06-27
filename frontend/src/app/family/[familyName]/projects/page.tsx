export default async function FamilyProjectsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family projects page for {familyName}</div>;
}
