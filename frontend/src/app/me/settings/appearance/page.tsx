import type { Metadata } from "next";
import { AppearanceSettingsPage } from "@/components/settings/appearance-settings-page";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: `${enMessages.AppShell.appearance.title} | Rwanda Family`,
  description: enMessages.AppShell.appearance.description,
};

export default function PersonalAppearanceSettingsPage() {
  return <AppearanceSettingsPage />;
}
