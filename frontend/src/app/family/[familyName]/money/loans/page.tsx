import { MoneyLoansPage } from "@/components/family/money/money-loans-page";

export default async function FamilyMoneyLoansPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyLoansPage familyName={familyName} />;
}
