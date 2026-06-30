import { FamilyMoneySectionPage } from "@/components/family/money/family-money-section-page";

export default async function FamilyMoneyApprovalsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <FamilyMoneySectionPage familyName={familyName} section="approvals" />;
}
