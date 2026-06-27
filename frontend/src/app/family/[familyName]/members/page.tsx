export default async function FamilyMembersPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family members page for {familyName}</div>;
}
