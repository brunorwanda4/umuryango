import { FamilyMoneySectionPage } from "@/components/family/money/family-money-section-page";

export default async function FamilyMoneyBudgetsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyMoneySectionPage familyName={familyName} section="budgets" />;
}
