import type { Metadata } from "next";
import { PersonalOverviewPage } from "@/components/me/overview/personal-overview-page";

export const metadata: Metadata = {
  title: "Overview | Rwanda Family",
  description:
    "Review your personal money, plans, debts, family workspaces, and recent activity.",
};

export default function MePage() {
  return <PersonalOverviewPage />;
}
