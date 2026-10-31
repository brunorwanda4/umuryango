import type { Metadata } from "next";
import { PersonalOverviewPage } from "@/components/me/overview/personal-overview-page";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.PersonalOverview.metadataTitle,
  description: enMessages.PersonalOverview.metadataDescription,
};

export default function MePage() {
  return <PersonalOverviewPage />;
}
