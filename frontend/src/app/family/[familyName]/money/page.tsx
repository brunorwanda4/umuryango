export default async function FamilyMoneyPage({
  params,
}: {
  params: { familyName: string };
}) {
  const { familyName } = params;
  return <div>Family money page for {familyName}</div>;
}
