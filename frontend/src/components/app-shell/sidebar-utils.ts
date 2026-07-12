import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeDollarSignIcon,
  BellIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ContactRoundIcon,
  FileClockIcon,
  FileTextIcon,
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
  TargetIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
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

const personalSettingsChildren: NavigationItem[] = [
  {
    title: "Account",
    href: "/me/settings",
    icon: sidebarIcon("account", SettingsIcon),
  },
  {
    title: "Security",
    href: "/me/security",
    icon: sidebarIcon("security", ShieldCheckIcon),
  },
  {
    title: "Help and guides",
    href: "/items",
    icon: sidebarIcon("help", BookOpenCheckIcon),
  },
];

const personalMoneyChildren: NavigationItem[] = [
  {
    title: "Overview",
    href: "/me/money",
    icon: sidebarIcon("money", BadgeDollarSignIcon),
    exact: true,
  },
  {
    title: "Income",
    href: "/me/money/income",
    icon: sidebarIcon("income", ArrowDownIcon),
  },
  {
    title: "Expenses",
    href: "/me/money/expenses",
    icon: sidebarIcon("expense", ArrowUpIcon),
  },
  {
    title: "Categories",
    href: "/me/money/categories",
    icon: sidebarIcon("categories", FolderTreeIcon),
  },
  {
    title: "Loans",
    href: "/me/money/loans",
    icon: sidebarIcon("loan", LandmarkIcon),
  },
];

export const personalNavigation: NavigationGroup[] = [
  {
    label: "Personal",
    items: [
      {
        title: "Overview",
        href: "/me",
        icon: sidebarIcon("dashboard", LayoutDashboardIcon),
      },
      {
        title: "My money",
        href: "/me/money",
        icon: sidebarIcon("money", WalletCardsIcon),
        items: personalMoneyChildren,
      },
      {
        title: "Plans",
        href: "/me/plans",
        icon: sidebarIcon("plan", ListChecksIcon),
      },
      {
        title: "Debts",
        href: "/me/debts",
        icon: sidebarIcon("debt", LandmarkIcon),
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Documents",
        href: "/me/documents",
        icon: sidebarIcon("documents", FileTextIcon),
      },
      {
        title: "Family workspaces",
        href: "/family",
        icon: sidebarIcon("family", UsersIcon),
      },
      {
        title: "Settings",
        href: "/me/settings",
        icon: sidebarIcon("settings", SettingsIcon),
        items: personalSettingsChildren,
      },
    ],
  },
];

export const personalSettingsNavigation: NavigationGroup[] = [
  {
    label: "Personal settings",
    items: [
      {
        title: "Account",
        href: "/me/settings",
        icon: sidebarIcon("account", SettingsIcon),
        exact: true,
      },
      {
        title: "Security",
        href: "/me/security",
        icon: sidebarIcon("security", ShieldCheckIcon),
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        title: "Help and guides",
        href: "/items",
        icon: sidebarIcon("help", BookOpenCheckIcon),
      },
    ],
  },
];

const getFamilySettingsChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "General",
    href: `${familyHref}/settings/general`,
    icon: sidebarIcon("settings", SettingsIcon),
  },
  {
    title: "Members and access",
    href: `${familyHref}/settings/members`,
    icon: sidebarIcon("members", UsersIcon),
  },
  {
    title: "Audit",
    href: `${familyHref}/settings/audit`,
    icon: sidebarIcon("audit", ClipboardListIcon),
  },
];

const getFamilyMoneyChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "Overview",
    href: `${familyHref}/money`,
    icon: sidebarIcon("money", BadgeDollarSignIcon),
    exact: true,
  },
  {
    title: "Income",
    href: `${familyHref}/money/income`,
    icon: sidebarIcon("income", ArrowDownIcon),
  },
  {
    title: "Expenses",
    href: `${familyHref}/money/expenses`,
    icon: sidebarIcon("expense", ArrowUpIcon),
  },
  {
    title: "Categories",
    href: `${familyHref}/money/categories`,
    icon: sidebarIcon("categories", FolderTreeIcon),
  },
  {
    title: "Approvals",
    href: `${familyHref}/money/approvals`,
    icon: sidebarIcon("approved", FileClockIcon),
  },
  {
    title: "Loans",
    href: `${familyHref}/money/loans`,
    icon: sidebarIcon("loan", LandmarkIcon),
  },
];

export const getFamilyNavigation = (familySlug: string): NavigationGroup[] => {
  const familyHref = `/family/${familySlug}`;

  return [
    {
      label: "Family",
      items: [
        {
          title: "Dashboard",
          href: familyHref,
          icon: sidebarIcon("dashboard", HomeIcon),
        },
        {
          title: "Money",
          href: `${familyHref}/money`,
          icon: sidebarIcon("money", BadgeDollarSignIcon),
          items: getFamilyMoneyChildren(familyHref),
        },
        {
          title: "Projects",
          href: `${familyHref}/projects`,
          icon: sidebarIcon("projects", FolderKanbanIcon),
        },
        {
          title: "Reports",
          href: `${familyHref}/reports`,
          icon: sidebarIcon("reports", ReceiptTextIcon),
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Events",
          href: `${familyHref}/events`,
          icon: sidebarIcon("calendar", CalendarDaysIcon),
        },
        {
          title: "Announcements",
          href: `${familyHref}/announcements`,
          icon: sidebarIcon("announcement", BellIcon),
        },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: sidebarIcon("documents", FileTextIcon),
        },
        {
          title: "Contacts",
          href: `${familyHref}/contacts`,
          icon: sidebarIcon("contacts", ContactRoundIcon),
        },
        {
          title: "Members",
          href: `${familyHref}/members`,
          icon: sidebarIcon("members", UsersIcon),
        },
        {
          title: "Settings",
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
      label: "Family settings",
      items: getFamilySettingsChildren(familyHref),
    },
    {
      label: "Related pages",
      items: [
        {
          title: "Members",
          href: `${familyHref}/members`,
          icon: sidebarIcon("members", UsersIcon),
        },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: sidebarIcon("documents", FileTextIcon),
        },
      ],
    },
  ];
};

export const workspaceLinks = [
  {
    title: "Personal workspace",
    href: "/me",
    icon: sidebarIcon("account", WalletCardsIcon),
  },
  {
    title: "All families",
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
    return "Family workspace";
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
