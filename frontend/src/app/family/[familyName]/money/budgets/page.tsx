import { MoneyBudgetsPage } from "@/components/family/money/money-budgets-page";

export default async function FamilyMoneyBudgetsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyBudgetsPage familyName={familyName} />;
}
