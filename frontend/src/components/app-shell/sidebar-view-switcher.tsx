"use client";

import { ChevronLeftIcon, SettingsIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SidebarView } from "./sidebar-utils";

export function SidebarViewSwitcher({
  value,
  onChange,
}: {
  value: SidebarView;
  onChange: (value: SidebarView) => void;
}) {
  const showingSettings = value === "settings";
  const label = showingSettings
    ? "Back to main sidebar"
    : "Open settings sidebar";
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
          <span>Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
