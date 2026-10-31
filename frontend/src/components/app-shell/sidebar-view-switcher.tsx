"use client";

import { ChevronLeftIcon, SettingsIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createTranslator } from "@/i18n/translate";
import type { SidebarView } from "./sidebar-utils";

export function SidebarViewSwitcher({
  value,
  onChange,
}: {
  value: SidebarView;
  onChange: (value: SidebarView) => void;
}) {
  const t = createTranslator("AppShell.sidebar");
  const showingSettings = value === "settings";
  const label = showingSettings
    ? t("backToMainSidebar")
    : t("openSettingsSidebar");
  const Icon = showingSettings ? ChevronLeftIcon : SettingsIcon;

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:hidden">
      <SidebarMenuItem>
        <SidebarMenuButton
          className="h-9"
          tooltip={label}
          aria-label={label}
          onClick={() => onChange(showingSettings ? "main" : "settings")}
        >
          <Icon aria-hidden="true" />
          <span>{t("settings")}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
