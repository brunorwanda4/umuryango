import type { Metadata } from "next";
import { NotificationsPageView } from "@/components/notifications/notifications-page-view";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.NotificationsPage.metadataTitle,
  description: enMessages.NotificationsPage.metadataDescription,
};

export default function NotificationsPage() {
  return <NotificationsPageView />;
}
