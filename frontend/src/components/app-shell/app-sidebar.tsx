"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import AppFooter from "./app-footer";
import AppNavbar from "./app-navbar";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";
import { MobileInstallPrompt } from "./mobile-install-prompt";
import { SidebarNavigationGroups } from "./sidebar-navigation";
import { SidebarResizeHandle } from "./sidebar-resize-handle";
import {
  type AppSidebarMode,
  formatFamilyName,
  getFamilyNavigation,
  getFamilySettingsNavigation,
  isSettingsPath,
  personalNavigation,
  personalSettingsNavigation,
  type SidebarView,
} from "./sidebar-utils";
import { SidebarViewSwitcher } from "./sidebar-view-switcher";
import { WorkspaceSwitcher } from "./workspace-switcher";

type AppSidebarShellProps = {
  children: ReactNode;
  mode: AppSidebarMode;
  familySlug?: string;
};

function useCurrentHash() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  return hash;
}

export function AppSidebarShell(props: AppSidebarShellProps) {
  return (
    <SidebarProvider>
      <AppSidebarContent {...props} />
    </SidebarProvider>
  );
}

function AppSidebarContent({ children, mode, familySlug }: AppSidebarShellProps) {
  const pathname = usePathname();
  const encodedFamilySlug = encodeURIComponent(familySlug ?? "");
  const { setOpenMobile, open } = useSidebar();
  const { user } = useCurrentUser();
  const currentHash = useCurrentHash();
  const familyName = formatFamilyName(familySlug);
  const navigation =
    mode === "family" && encodedFamilySlug
      ? getFamilyNavigation(encodedFamilySlug)
      : personalNavigation;
  const settingsNavigation =
    mode === "family" && encodedFamilySlug
      ? getFamilySettingsNavigation(encodedFamilySlug)
      : personalSettingsNavigation;
  const isSettingsArea = isSettingsPath(pathname, mode, encodedFamilySlug);
  const [sidebarView, setSidebarView] = useState<SidebarView>(isSettingsArea ? "settings" : "main");
  const showingSettingsNavigation = isSettingsArea && sidebarView === "settings";
  const activeNavigation = showingSettingsNavigation ? settingsNavigation : navigation;
  const sidebarTitle = showingSettingsNavigation
    ? mode === "family"
      ? "Family settings"
      : "Personal settings"
    : mode === "family"
      ? familyName
      : "Personal workspace";

  useEffect(() => {
    setSidebarView(isSettingsArea ? "settings" : "main");
  }, [isSettingsArea]);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn(
          "[&_[data-slot=sidebar-inner]]:bg-background",
          "[&_[data-slot=sidebar-inner]]:md:top-14",
          "[&_[data-slot=sidebar-inner]]:md:h-[calc(100vh-3.5rem)]",
          "[&>div:first-child]:md:h-[calc(100vh-3.5rem)]",
          "[&>div:first-child]:md:mt-14",
          open &&
            "md:!border-r-0 md:!bg-transparent md:[&>[data-slot=sidebar-inner]]:!bg-transparent",
        )}
      >
        <SidebarHeader>
          <div className="flex flex-col gap-2 px-1">
            {isSettingsArea ? (
              <SidebarViewSwitcher value={sidebarView} onChange={setSidebarView} />
            ) : null}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNavigationGroups
            groups={activeNavigation}
            pathname={pathname}
            currentHash={currentHash}
          />
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <WorkspaceSwitcher
                currentFamilyName={familyName}
                currentFamilyHref={encodedFamilySlug ? `/family/${encodedFamilySlug}` : undefined}
                mode={mode}
                user={user}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
        <SidebarResizeHandle open={open} />
      </Sidebar>
      <SidebarInset className="flex flex-col pt-14">
        <AppNavbar sidebarTitle={sidebarTitle} />
        <main className="flex-1 min-w-0 max-w-full p-4 pb-32 sm:p-6 sm:pb-36 md:pb-6 md:px-16">
          <div className="min-h-screen">{children}</div>
          <AppFooter />
        </main>
      </SidebarInset>
      <MobileInstallPrompt />
      <MobileBottomNavigation
        mode={mode}
        navigation={activeNavigation}
        onOpenMore={() => setOpenMobile(true)}
        pathname={pathname}
        currentHash={currentHash}
      />
    </>
  );
}
