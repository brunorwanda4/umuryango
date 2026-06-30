import { MoneyExpensesPage } from "@/components/family/money/money-expenses-page";

export default async function FamilyMoneyExpensesPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyExpensesPage familyName={familyName} />;
}
