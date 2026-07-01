export default async function FamilyMoneyApprovalsPage({
	params,
}: {
	params: Promise<{ familyName: string }>;
}) {
	const { familyName } = await params;

	return <div>MoneyApprovalsPage</div>;
}
