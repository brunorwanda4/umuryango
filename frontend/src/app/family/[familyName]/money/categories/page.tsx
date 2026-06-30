import { FamilyMoneySectionPage } from "@/components/family/money/family-money-section-page";

export default async function FamilyMoneyCategoriesPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return (
    <FamilyMoneySectionPage familyName={familyName} section="categories" />
  );
}
