import { MoneyCategoriesPage } from "@/components/family/money/money-categories-page";

export default async function FamilyMoneyCategoriesPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <MoneyCategoriesPage familyName={familyName} />;
}
