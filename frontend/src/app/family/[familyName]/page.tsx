export default async function FamilyPage({
	params,
}: {
	params: { familyName: string };
}) {
	const { familyName } = params;
	return <div>Family page for {familyName}</div>;
}
