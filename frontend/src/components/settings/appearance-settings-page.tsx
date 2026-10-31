"use client";

import { SidebarIconStyleSettings } from "@/components/app-shell/sidebar-icon-style-settings";
import { PageTitle } from "@/components/common/pages/page-title";
import { createTranslator } from "@/i18n/translate";

interface AppearanceSettingsPageProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
}

export function AppearanceSettingsPage({
  title,
  description,
  showHeader = true,
}: AppearanceSettingsPageProps = {}) {
  const t = createTranslator("AppShell.appearance");

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {showHeader && (
        <PageTitle
          title={title ?? t((m) => m.AppShell.appearance.title)}
          description={description ?? t((m) => m.AppShell.appearance.description)}
        />
      )}
      <SidebarIconStyleSettings />
    </div>
  );
}
