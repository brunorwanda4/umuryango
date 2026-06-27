export default async function FamilyEventsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family events page for {familyName}</div>;
}
