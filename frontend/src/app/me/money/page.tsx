import type { Metadata } from "next";
import { PersonalMoneyPage } from "@/components/money/personal-money-page";

export const metadata: Metadata = {
  title: "My Money · Personal workspace",
  description:
    "Manage income, expenses, savings, debts, and recent money activity in one place.",
};

export default function MyMoneyPage() {
  return <PersonalMoneyPage />;
}
