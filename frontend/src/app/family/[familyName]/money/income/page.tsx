import { MoneyIncomePage } from "@/components/family/money/money-income-page";

export default async function FamilyMoneyIncomePage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyIncomePage familyName={familyName} />;
}
