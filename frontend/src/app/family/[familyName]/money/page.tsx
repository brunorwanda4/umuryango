import { FamilyMoneyWorkspace } from "@/components/family/money/family-money-workspace";

export default async function FamilyMoneyPage({
	params,
}: {
	params: Promise<{ familyName: string }>;
}) {
	const { familyName } = await params;

	return <FamilyMoneyWorkspace familyName={familyName} />;
}
