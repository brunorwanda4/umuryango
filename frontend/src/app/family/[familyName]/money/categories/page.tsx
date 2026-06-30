export default async function FamilyMoneyCategoriesPage({
	params,
}: {
	params: Promise<{ familyName: string }>;
}) {
	const { familyName } = await params;

	return <div>Money Categories</div>;
}
