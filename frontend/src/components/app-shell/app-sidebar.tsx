"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSignIcon,
  BanknoteArrowDownIcon,
  BellIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  HomeIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

type AppSidebarMode = "family" | "personal";

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
      { title: "Settings", href: "/me/settings", icon: SettingsIcon },
    ],
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
        },
      ],
    },
  ];
};

const workspaceLinks = [
  { title: "Personal workspace", href: "/me", icon: WalletCardsIcon },
  { title: "All families", href: "/family", icon: UsersIcon },
];

export function AppSidebarShell({
  children,
  mode,
  familySlug,
}: AppSidebarShellProps) {
  const pathname = usePathname();
  const encodedFamilySlug = encodeURIComponent(familySlug ?? "");
  const familyName = formatFamilyName(familySlug);
  const navigation =
    mode === "family" && encodedFamilySlug
      ? getFamilyNavigation(encodedFamilySlug)
      : personalNavigation;
  const activeItem = getActiveNavigationItem(pathname, navigation);
  const title =
    activeItem?.title ??
    (mode === "family" ? familyName : "Personal workspace");
  const contextLabel =
    mode === "family" ? "Family workspace" : "Personal workspace";

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="[&_[data-slot=sidebar-inner]]:bg-background"
      >
        <SidebarHeader>
          <WorkspaceSwitcher
            currentFamilyName={familyName}
            currentFamilyHref={
              encodedFamilySlug ? `/family/${encodedFamilySlug}` : undefined
            }
            mode={mode}
          />
        </SidebarHeader>
        <SidebarContent>
          {navigation.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActivePath(pathname, item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Security">
                <Link href="/me/security">
                  <ShieldCheckIcon aria-hidden="true" />
                  <span>Security</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Help and guides">
                <Link href="/items">
                  <BookOpenCheckIcon aria-hidden="true" />
                  <span>Help and guides</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 flex min-h-14 items-center gap-3 border-border border-b bg-background px-4 pr-20 sm:px-6 sm:pr-24">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-col">
            <span className="text-muted-foreground text-xs">
              {contextLabel}
            </span>
            <h1 className="truncate font-semibold text-sm">{title}</h1>
          </div>
        </header>
        <main className="min-h-[calc(100svh-3.5rem)] p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function WorkspaceSwitcher({
  currentFamilyName,
  currentFamilyHref,
  mode,
}: {
  currentFamilyName: string;
  currentFamilyHref?: string;
  mode: AppSidebarMode;
}) {
  const title = mode === "family" ? currentFamilyName : "Personal workspace";
  const description = mode === "family" ? "Family workspace" : "Your money";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip={title}>
          <Avatar size="sm">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getActiveNavigationItem(
  pathname: string,
  navigation: NavigationGroup[],
) {
  return navigation
    .flatMap((group) => group.items)
    .find((item) => isActivePath(pathname, item.href));
}

function isActivePath(pathname: string, href: string) {
  if (href === "/me" || /^\/family\/[^/]+$/.test(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
