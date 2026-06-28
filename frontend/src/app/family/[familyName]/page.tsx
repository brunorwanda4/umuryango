export default async function FamilyPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  return <div>Family page for {familyName}</div>;
}
