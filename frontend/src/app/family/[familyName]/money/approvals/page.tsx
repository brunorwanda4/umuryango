import { MoneyApprovalsPage } from "@/components/family/money/money-approvals-page";

export default async function FamilyMoneyApprovalsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyApprovalsPage familyName={familyName} />;
}
