export default async function FamilyReportsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family reports page for {familyName}</div>;
}
