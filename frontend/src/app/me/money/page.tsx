import type { Metadata } from "next";
import { PersonalMoneyPage } from "@/components/money/personal-money-page";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.PersonalMoney.metadataTitle,
  description: enMessages.PersonalMoney.metadataDescription,
};

export default function MyMoneyPage() {
  return <PersonalMoneyPage />;
}
