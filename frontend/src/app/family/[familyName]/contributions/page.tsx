export default async function FamilyContributionsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family contributions page for {familyName}</div>;
}
