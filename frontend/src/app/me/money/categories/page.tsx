import type { Metadata } from "next";
import { PersonalCategoriesPage } from "@/components/money/personal-categories-page";

export const metadata: Metadata = {
  title: "Categories · Personal workspace",
  description:
    "Manage the income and expense categories used in your personal money records.",
};

export default function CategoriesPage() {
  return <PersonalCategoriesPage />;
}
