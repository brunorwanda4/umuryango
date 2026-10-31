import type { Metadata } from "next";
import { formatFamilyName } from "@/components/app-shell/sidebar-utils";
import { NotificationsPageView } from "@/components/notifications/notifications-page-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ familyName: string }>;
}): Promise<Metadata> {
  const { familyName } = await params;
  const displayName = formatFamilyName(familyName);

  return {
    title: `Notifications | ${displayName} | Umuryango`,
    description: `View notifications for ${displayName}.`,
  };
}

export default async function FamilyNotificationsPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = await params;
  const displayName = formatFamilyName(familyName);

  return (
    <NotificationsPageView
      scope={{
        type: "family",
        familySlug: familyName,
        familyName: displayName,
      }}
    />
  );
}
