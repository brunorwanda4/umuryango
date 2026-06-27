export default async function FamilyDocumentsPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family documents page for {familyName}</div>;
}
