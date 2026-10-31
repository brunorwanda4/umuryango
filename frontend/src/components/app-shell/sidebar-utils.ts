import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeDollarSignIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ContactRoundIcon,
  FileClockIcon,
  FolderKanbanIcon,
  FolderTreeIcon,
  HomeIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  type LucideIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import { createTranslator } from "@/i18n/translate";
import type { SidebarIconSource } from "./sidebar-icon";

const sidebarIcon = (
  imageName: string,
  lineIcon: LucideIcon,
): SidebarIconSource => ({
  image: {
    src: `/images/icons/${imageName}.png`,
  },
  line: lineIcon,
});

export type NavigationItem = {
  title: string;
  href: string;
  icon: SidebarIconSource;
  exact?: boolean;
  items?: NavigationItem[];
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export type AppSidebarMode = "family" | "personal";
export type SidebarView = "main" | "settings";

const tNav = createTranslator("AppShell.navigation");
const tItems = createTranslator("AppShell.navigation.items");
const tGroups = createTranslator("AppShell.navigation.groups");

const personalSettingsChildren: NavigationItem[] = [
  {
    title: tItems((m) => m.AppShell.navigation.items.account),
    href: "/me/settings",
    icon: sidebarIcon("account", SettingsIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.security),
    href: "/me/security",
    icon: sidebarIcon("security", ShieldCheckIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.help),
    href: "/items",
    icon: sidebarIcon("help", BookOpenCheckIcon),
  },
];

const personalMoneyChildren: NavigationItem[] = [
  {
    title: tItems((m) => m.AppShell.navigation.items.overview),
    href: "/me/money",
    icon: sidebarIcon("money", BadgeDollarSignIcon),
    exact: true,
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.income),
    href: "/me/money/income",
    icon: sidebarIcon("income", ArrowDownIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.expenses),
    href: "/me/money/expenses",
    icon: sidebarIcon("expense", ArrowUpIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.categories),
    href: "/me/money/categories",
    icon: sidebarIcon("categories", FolderTreeIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.loans),
    href: "/me/money/loans",
    icon: sidebarIcon("loan", LandmarkIcon),
  },
];

export const personalNavigation: NavigationGroup[] = [
  {
    label: tGroups((m) => m.AppShell.navigation.groups.personal),
    items: [
      {
        title: tItems((m) => m.AppShell.navigation.items.overview),
        href: "/me",
        icon: sidebarIcon("dashboard", LayoutDashboardIcon),
      },
      {
        title: tItems((m) => m.AppShell.navigation.items.money),
        href: "/me/money",
        icon: sidebarIcon("money", WalletCardsIcon),
        items: personalMoneyChildren,
      },
      {
        title: tItems((m) => m.AppShell.navigation.items.plans),
        href: "/me/plans",
        icon: sidebarIcon("plan", ListChecksIcon),
      },
      {
        title: tItems((m) => m.AppShell.navigation.items.contacts),
        href: "/me/contacts",
        icon: sidebarIcon("contacts", ContactRoundIcon),
      },
    ],
  },
  {
    label: tGroups((m) => m.AppShell.navigation.groups.family),
    items: [
      {
        title: tItems((m) => m.AppShell.navigation.items.familyWorkspaces),
        href: "/family",
        icon: sidebarIcon("family", UsersIcon),
      },
      {
        title: tItems((m) => m.AppShell.navigation.items.settings),
        href: "/me/settings",
        icon: sidebarIcon("settings", SettingsIcon),
        items: personalSettingsChildren,
      },
    ],
  },
];

export const personalSettingsNavigation: NavigationGroup[] = [
  {
    label: tGroups((m) => m.AppShell.navigation.groups.personal),
    items: [
      {
        title: tItems((m) => m.AppShell.navigation.items.account),
        href: "/me/settings",
        icon: sidebarIcon("account", SettingsIcon),
        exact: true,
      },
      {
        title: tItems((m) => m.AppShell.navigation.items.security),
        href: "/me/security",
        icon: sidebarIcon("security", ShieldCheckIcon),
      },
    ],
  },
  {
    label: tItems((m) => m.AppShell.navigation.items.help),
    items: [
      {
        title: tItems((m) => m.AppShell.navigation.items.help),
        href: "/items",
        icon: sidebarIcon("help", BookOpenCheckIcon),
      },
    ],
  },
];

const getFamilySettingsChildren = (familyHref: string): NavigationItem[] => [
  {
    title: tItems((m) => m.AppShell.navigation.items.general),
    href: `${familyHref}/settings/general`,
    icon: sidebarIcon("settings", SettingsIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.members),
    href: `${familyHref}/settings/members`,
    icon: sidebarIcon("members", UsersIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.audit),
    href: `${familyHref}/settings/audit`,
    icon: sidebarIcon("audit", ClipboardListIcon),
  },
];

const getFamilyMoneyChildren = (familyHref: string): NavigationItem[] => [
  {
    title: tItems((m) => m.AppShell.navigation.items.overview),
    href: `${familyHref}/money`,
    icon: sidebarIcon("money", BadgeDollarSignIcon),
    exact: true,
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.income),
    href: `${familyHref}/money/income`,
    icon: sidebarIcon("income", ArrowDownIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.expenses),
    href: `${familyHref}/money/expenses`,
    icon: sidebarIcon("expense", ArrowUpIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.categories),
    href: `${familyHref}/money/categories`,
    icon: sidebarIcon("categories", FolderTreeIcon),
  },
  {
    title: tNav((m) => m.AppShell.navigation.items.dashboard), // or approvals
    href: `${familyHref}/money/approvals`,
    icon: sidebarIcon("approved", FileClockIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.loans),
    href: `${familyHref}/money/loans`,
    icon: sidebarIcon("loan", LandmarkIcon),
  },
];

export const getFamilyNavigation = (familySlug: string): NavigationGroup[] => {
  const familyHref = `/family/${familySlug}`;

  return [
    {
      label: tGroups((m) => m.AppShell.navigation.groups.family),
      items: [
        {
          title: tItems((m) => m.AppShell.navigation.items.dashboard),
          href: familyHref,
          icon: sidebarIcon("dashboard", HomeIcon),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.money),
          href: `${familyHref}/money`,
          icon: sidebarIcon("money", BadgeDollarSignIcon),
          items: getFamilyMoneyChildren(familyHref),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.projects),
          href: `${familyHref}/projects`,
          icon: sidebarIcon("projects", FolderKanbanIcon),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.reports),
          href: `${familyHref}/reports`,
          icon: sidebarIcon("reports", ReceiptTextIcon),
        },
      ],
    },
    {
      label: tGroups((m) => m.AppShell.navigation.groups.management),
      items: [
        {
          title: tItems((m) => m.AppShell.navigation.items.events),
          href: `${familyHref}/events`,
          icon: sidebarIcon("calendar", CalendarDaysIcon),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.contacts),
          href: `${familyHref}/contacts`,
          icon: sidebarIcon("contacts", ContactRoundIcon),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.members),
          href: `${familyHref}/members`,
          icon: sidebarIcon("members", UsersIcon),
        },
        {
          title: tItems((m) => m.AppShell.navigation.items.settings),
          href: `${familyHref}/settings`,
          icon: sidebarIcon("settings", SettingsIcon),
          items: getFamilySettingsChildren(familyHref),
        },
      ],
    },
  ];
};

export const getFamilySettingsNavigation = (
  familySlug: string,
): NavigationGroup[] => {
  const familyHref = `/family/${familySlug}`;

  return [
    {
      label: tGroups((m) => m.AppShell.navigation.groups.system),
      items: getFamilySettingsChildren(familyHref),
    },
    {
      label: tGroups((m) => m.AppShell.navigation.groups.management),
      items: [
        {
          title: tItems((m) => m.AppShell.navigation.items.members),
          href: `${familyHref}/members`,
          icon: sidebarIcon("members", UsersIcon),
        },
      ],
    },
  ];
};

export const workspaceLinks = [
  {
    title: tItems((m) => m.AppShell.navigation.items.overview),
    href: "/me",
    icon: sidebarIcon("account", WalletCardsIcon),
  },
  {
    title: tItems((m) => m.AppShell.navigation.items.families),
    href: "/family",
    icon: sidebarIcon("family", UsersIcon),
  },
];

export function isSettingsPath(
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

export function isActivePath(
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

export function formatFamilyName(familySlug?: string) {
  if (!familySlug) {
    return createTranslator("AppShell.workspaceSwitcher")("familyWorkspace");
  }

  return decodeURIComponent(familySlug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
