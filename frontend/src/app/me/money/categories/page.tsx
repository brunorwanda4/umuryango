import type { Metadata } from "next";
import { PersonalCategoriesPage } from "@/components/money/personal-categories-page";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.PersonalMoney.categoriesMetadataTitle,
  description: enMessages.PersonalMoney.categoriesMetadataDescription,
};

export default function CategoriesPage() {
  return <PersonalCategoriesPage />;
}
