"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSignIcon,
  BanknoteArrowDownIcon,
  BellIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  DownloadIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  HomeIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  LogOutIcon,
  MenuIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { type CurrentUser, useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";

type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  items?: NavigationItem[];
};

const personalSettingsChildren: NavigationItem[] = [
  { title: "Account", href: "/me/settings", icon: SettingsIcon },
  { title: "Security", href: "/me/security", icon: ShieldCheckIcon },
  { title: "Help and guides", href: "/items", icon: BookOpenCheckIcon },
];

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

type AppSidebarMode = "family" | "personal";
type SidebarView = "main" | "settings";

type AppSidebarShellProps = {
  children: ReactNode;
  mode: AppSidebarMode;
  familySlug?: string;
};

const personalNavigation: NavigationGroup[] = [
  {
    label: "Personal",
    items: [
      { title: "Overview", href: "/me", icon: LayoutDashboardIcon },
      { title: "My money", href: "/me/money", icon: WalletCardsIcon },
      { title: "Plans", href: "/me/plans", icon: ListChecksIcon },
      { title: "Savings goals", href: "/me/savings", icon: TargetIcon },
      { title: "Debts", href: "/me/debts", icon: LandmarkIcon },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Documents", href: "/me/documents", icon: FileTextIcon },
      { title: "Family workspaces", href: "/family", icon: UsersIcon },
      {
        title: "Settings",
        href: "/me/settings",
        icon: SettingsIcon,
        items: personalSettingsChildren,
      },
    ],
  },
];

const personalSettingsNavigation: NavigationGroup[] = [
  {
    label: "Personal settings",
    items: [
      {
        title: "Account",
        href: "/me/settings",
        icon: SettingsIcon,
        exact: true,
      },
      { title: "Security", href: "/me/security", icon: ShieldCheckIcon },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Help and guides", href: "/items", icon: BookOpenCheckIcon },
    ],
  },
];

const getFamilySettingsChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "General",
    href: `${familyHref}/settings/general`,
    icon: SettingsIcon,
  },
  {
    title: "Members and access",
    href: `${familyHref}/settings/members`,
    icon: UsersIcon,
  },
  {
    title: "Audit",
    href: `${familyHref}/settings/audit`,
    icon: ClipboardListIcon,
  },
];

const getFamilyNavigation = (familySlug: string): NavigationGroup[] => {
  const familyHref = `/family/${familySlug}`;

  return [
    {
      label: "Family",
      items: [
        { title: "Dashboard", href: familyHref, icon: HomeIcon },
        {
          title: "Money",
          href: `${familyHref}/money`,
          icon: BadgeDollarSignIcon,
        },
        {
          title: "Contributions",
          href: `${familyHref}/contributions`,
          icon: HandCoinsIcon,
        },
        {
          title: "Projects",
          href: `${familyHref}/projects`,
          icon: FolderKanbanIcon,
        },
        {
          title: "Reports",
          href: `${familyHref}/reports`,
          icon: ReceiptTextIcon,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Events",
          href: `${familyHref}/events`,
          icon: CalendarDaysIcon,
        },
        {
          title: "Announcements",
          href: `${familyHref}/announcements`,
          icon: BellIcon,
        },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: FileTextIcon,
        },
        { title: "Members", href: `${familyHref}/members`, icon: UsersIcon },
        {
          title: "Settings",
          href: `${familyHref}/settings`,
          icon: SettingsIcon,
          items: getFamilySettingsChildren(familyHref),
        },
      ],
    },
  ];
};

const getFamilySettingsNavigation = (familySlug: string): NavigationGroup[] => {
  const familyHref = `/family/${familySlug}`;

  return [
    {
      label: "Family settings",
      items: getFamilySettingsChildren(familyHref),
    },
    {
      label: "Related pages",
      items: [
        { title: "Members", href: `${familyHref}/members`, icon: UsersIcon },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: FileTextIcon,
        },
      ],
    },
  ];
};

const workspaceLinks = [
  { title: "Personal workspace", href: "/me", icon: WalletCardsIcon },
  { title: "All families", href: "/family", icon: UsersIcon },
];

const RESIZE_STORAGE_KEY = "sidebar-width";
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 256;

function SidebarResizeHandle({ open }: { open: boolean }) {
  const { toggleSidebar, state } = useSidebar();

  useLayoutEffect(() => {
    const stored = localStorage.getItem(RESIZE_STORAGE_KEY);
    if (!stored) return;
    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (wrapper) wrapper.style.setProperty("--sidebar-width", stored);
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    if (state === "collapsed") {
      toggleSidebar();
      return;
    }
    e.preventDefault();

    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (!wrapper) return;
    const sidebarWrapper = wrapper;

    const gap = sidebarWrapper.querySelector(
      '[data-slot="sidebar-gap"]',
    ) as HTMLElement | null;
    const startWidth = gap
      ? gap.getBoundingClientRect().width
      : SIDEBAR_DEFAULT_WIDTH;
    const startX = e.clientX;
    let didMove = false;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(me: MouseEvent) {
      const delta = me.clientX - startX;
      if (Math.abs(delta) > 3) didMove = true;
      const newW = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta),
      );
      sidebarWrapper.style.setProperty("--sidebar-width", `${newW}px`);
    }

    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (!didMove) {
        toggleSidebar();
      } else {
        const w = sidebarWrapper.style.getPropertyValue("--sidebar-width");
        if (w) localStorage.setItem(RESIZE_STORAGE_KEY, w);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Resize Sidebar"
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      title={state === "collapsed" ? "Expand Sidebar" : "Resize Sidebar"}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-colors ease-linear sm:flex",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        open
          ? "after:absolute after:inset-y-0 after:start-1/2 after:w-[1px] after:bg-sidebar-border"
          : null,
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        state === "collapsed" ? "cursor-e-resize" : "cursor-col-resize",
      )}
    />
  );
}

export function AppSidebarShell(props: AppSidebarShellProps) {
  return (
    <SidebarProvider>
      <AppSidebarContent {...props} />
    </SidebarProvider>
  );
}

function AppSidebarContent({
  children,
  mode,
  familySlug,
}: AppSidebarShellProps) {
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
  const [sidebarView, setSidebarView] = useState<SidebarView>(
    isSettingsArea ? "settings" : "main",
  );
  const showingSettingsNavigation =
    isSettingsArea && sidebarView === "settings";
  const activeNavigation = showingSettingsNavigation
    ? settingsNavigation
    : navigation;
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
          open &&
            "md:!border-r-0 md:!bg-transparent md:[&>[data-slot=sidebar-inner]]:!bg-transparent",
        )}
      >
        <SidebarHeader>
          <div className="flex flex-col gap-2 px-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-base text-transparent tracking-tight group-data-[collapsible=icon]:hidden">
                {sidebarTitle}
              </span>
              <SidebarTrigger />
            </div>
            {isSettingsArea ? (
              <SidebarViewSwitcher
                value={sidebarView}
                onChange={setSidebarView}
              />
            ) : null}
          </div>
        </SidebarHeader>
        <SidebarContent>
          {activeNavigation.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const childIsActive = item.items?.some((sub) =>
                      isActivePath(pathname, sub.href, currentHash, sub.exact),
                    );
                    const itemIsActive =
                      childIsActive ||
                      isActivePath(
                        pathname,
                        item.href,
                        currentHash,
                        item.exact,
                      );

                    return item.items?.length ? (
                      <Collapsible
                        key={item.href}
                        asChild
                        defaultOpen={itemIsActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={itemIsActive}
                              tooltip={item.title}
                            >
                              <item.icon aria-hidden="true" />
                              <span>{item.title}</span>
                              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((sub) => (
                                <SidebarMenuSubItem key={sub.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActivePath(
                                      pathname,
                                      sub.href,
                                      currentHash,
                                      sub.exact,
                                    )}
                                  >
                                    <Link href={sub.href}>
                                      <sub.icon aria-hidden="true" />
                                      <span>{sub.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={itemIsActive}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon aria-hidden="true" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <WorkspaceSwitcher
                currentFamilyName={familyName}
                currentFamilyHref={
                  encodedFamilySlug ? `/family/${encodedFamilySlug}` : undefined
                }
                mode={mode}
                user={user}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
        <SidebarResizeHandle open={open} />
      </Sidebar>
      <SidebarInset>
        <main className="min-h-[calc(100svh-3.5rem)] p-4 pb-32 sm:p-6 sm:pb-36 md:pb-6">
          {children}
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

function SidebarViewSwitcher({
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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function MobileInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    if (isStandalone || sessionStorage.getItem("install-prompt-dismissed")) {
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installPrompt || dismissed) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      sessionStorage.setItem("install-prompt-dismissed", "true");
      setDismissed(true);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("install-prompt-dismissed", "true");
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 z-40 md:hidden bottom-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-md border bg-background/95 p-2 shadow-lg backdrop-blur">
        <button
          type="button"
          className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm"
          onClick={handleInstall}
        >
          <DownloadIcon aria-hidden="true" className="size-4" />
          Install app
        </button>
        <button
          type="button"
          aria-label="Dismiss install app prompt"
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          onClick={handleDismiss}
        >
          Later
        </button>
      </div>
    </div>
  );
}

function MobileBottomNavigation({
  mode,
  navigation,
  onOpenMore,
  pathname,
  currentHash,
}: {
  mode: AppSidebarMode;
  navigation: NavigationGroup[];
  onOpenMore: () => void;
  pathname: string;
  currentHash: string;
}) {
  const items = getMobileNavigationItems(mode, navigation);
  const hasActiveItem = items.some((item) =>
    isActivePath(pathname, item.href, currentHash, item.exact),
  );

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = isActivePath(
            pathname,
            item.href,
            currentHash,
            item.exact,
          );
          const label = getMobileNavigationLabel(item.title);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
                isActive &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <item.icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="w-full truncate text-center font-medium text-[0.65rem] leading-none">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Open all navigation links"
          aria-current={!hasActiveItem ? "page" : undefined}
          className={cn(
            "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
            !hasActiveItem &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
          onClick={onOpenMore}
        >
          <MenuIcon aria-hidden="true" className="size-5 shrink-0" />
          <span className="w-full truncate text-center font-medium text-[0.65rem] leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}

function WorkspaceSwitcher({
  currentFamilyName,
  currentFamilyHref,
  mode,
  user,
}: {
  currentFamilyName: string;
  currentFamilyHref?: string;
  mode: AppSidebarMode;
  user: CurrentUser | null;
}) {
  const router = useRouter();
  const recentFamilies = useRecentFamilies();
  const workspaceTitle =
    mode === "family" ? currentFamilyName : "Personal workspace";
  const title = user?.fullName ?? workspaceTitle;
  const description =
    user?.email ?? (mode === "family" ? "Family workspace" : "Your money");

  async function handleLogout() {
    await apiRequest("post", "/auth/logout");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip={title}>
          <Avatar size="sm">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={title} />
            ) : null}
            <AvatarFallback>{getInitials(title)}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{title}</span>
            <span className="truncate text-muted-foreground text-xs">
              {description}
            </span>
          </span>
          <ChevronsUpDownIcon aria-hidden="true" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuGroup>
          {currentFamilyHref ? (
            <DropdownMenuItem asChild>
              <Link href={currentFamilyHref}>
                <UsersIcon aria-hidden="true" />
                {currentFamilyName}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {workspaceLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>
                <link.icon aria-hidden="true" />
                {link.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {recentFamilies.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Recent families</DropdownMenuLabel>
            <DropdownMenuGroup>
              {recentFamilies.map((family) => (
                <DropdownMenuItem key={family.id} asChild>
                  <Link href={`/family/${encodeURIComponent(family.slug)}`}>
                    <UsersIcon aria-hidden="true" />
                    {family.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/family">
              <ClipboardListIcon aria-hidden="true" />
              Manage family access
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/family/new">
              <BanknoteArrowDownIcon aria-hidden="true" />
              Create family
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOutIcon aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type RecentFamily = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

function useRecentFamilies() {
  const [families, setFamilies] = useState<RecentFamily[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await apiRequest<undefined, RecentFamily[]>(
        "get",
        "/families?limit=3",
      );

      if (active && response.ok) {
        setFamilies(response.data ?? []);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return families;
}

function getMobileNavigationItems(
  mode: AppSidebarMode,
  navigation: NavigationGroup[],
) {
  const items = navigation.flatMap((group) => group.items);
  const preferredHrefs =
    mode === "family"
      ? [
          items.find((item) => item.title === "Dashboard")?.href,
          items.find((item) => item.title === "Money")?.href,
          items.find((item) => item.title === "Contributions")?.href,
          items.find((item) => item.title === "Reports")?.href,
        ]
      : ["/me", "/me/money", "/me/plans", "/family"];
  const preferred = preferredHrefs
    .filter((href): href is string => Boolean(href))
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is NavigationItem => Boolean(item));

  return (preferred.length ? preferred : items).slice(0, 4);
}

function getMobileNavigationLabel(title: string) {
  if (title === "Overview") return "Home";
  if (title === "Contributions") return "Contribute";
  if (title === "Family workspaces") return "Families";

  return title;
}

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

function isSettingsPath(
  pathname: string,
  mode: AppSidebarMode,
  encodedFamilySlug: string,
) {
  if (mode === "family" && encodedFamilySlug) {
    const settingsHref = `/family/${encodedFamilySlug}/settings`;

    return pathname === settingsHref || pathname.startsWith(`${settingsHref}/`);
  }

  return (
    pathname === "/me/settings" ||
    pathname.startsWith("/me/settings/") ||
    pathname === "/me/security" ||
    pathname.startsWith("/me/security/")
  );
}

function isActivePath(
  pathname: string,
  href: string,
  currentHash = "",
  exact = false,
) {
  const [hrefPath, hrefHash] = href.split("#");
  const targetPath = hrefPath || href;

  if (hrefHash !== undefined) {
    return pathname === targetPath && currentHash === `#${hrefHash}`;
  }

  if (exact) {
    return pathname === targetPath && !currentHash;
  }

  if (targetPath === "/me" || /^\/family\/[^/]+$/.test(targetPath)) {
    return pathname === targetPath;
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

function formatFamilyName(familySlug?: string) {
  if (!familySlug) {
    return "Family workspace";
  }

  return decodeURIComponent(familySlug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
