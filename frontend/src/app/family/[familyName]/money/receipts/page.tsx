import { MoneyReceiptsPage } from "@/components/family/money/money-receipts-page";

export default async function FamilyMoneyReceiptsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyReceiptsPage familyName={familyName} />;
}
