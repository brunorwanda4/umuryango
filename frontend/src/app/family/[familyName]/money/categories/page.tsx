import { PersonalCategoriesPage } from "@/components/money/personal-categories-page";

export default async function FamilyMoneyCategoriesPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;

  return <PersonalCategoriesPage key={familyName} familyName={familyName} />;
}
