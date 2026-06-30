"use client";

import {
  ChevronsUpDownIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const label = value === "settings" ? "Settings sidebar" : "Main sidebar";
  const Icon = value === "settings" ? SettingsIcon : LayoutDashboardIcon;

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:hidden">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="sm" tooltip={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Sidebar</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onChange("main")}>
                <LayoutDashboardIcon aria-hidden="true" />
                Main sidebar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChange("settings")}>
                <SettingsIcon aria-hidden="true" />
                Settings sidebar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
