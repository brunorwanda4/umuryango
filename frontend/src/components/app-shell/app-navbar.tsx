"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { createTranslator } from "@/i18n/translate";
import AppNavbarFamilies from "./app-navbar-families";
import AppNavbarNotifications from "./app-navbar-notifications";
import AppNavbarSearch from "./app-navbar-search";

type AppNavbarProps = {
  sidebarTitle?: string;
};

export default function AppNavbar({ sidebarTitle }: AppNavbarProps) {
  const t = createTranslator("AppShell.navbar");

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md transition-all">
      {/* Left Section: Sidebar Trigger & Workspace/Page Title */}
      <div className="flex items-center gap-3 w-full">
        <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" />
        <div className="h-4 w-px bg-border/50 hidden md:block" />
        <span className="max-w-[200px] sm:max-w-[300px] truncate text-xl bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text font-bold  tracking-tight text-transparent">
          {sidebarTitle || t((m) => m.AppShell.navbar.personalWorkspace)}
        </span>
      </div>

      {/* Center & Mobile Search Component */}
      <div className="flex items-center gap-3 w-full justify-end sm:justify-between">
        <AppNavbarSearch />
        {/* Right Section: Notifications */}
        <div className="flex items-center gap-3">
          <AppNavbarFamilies />
          <AppNavbarNotifications />
        </div>
      </div>
    </nav>
  );
}
