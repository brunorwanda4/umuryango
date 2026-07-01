import type { LucideIcon } from "lucide-react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeDollarSignIcon,
  BellIcon,
  BookOpenCheckIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileClockIcon,
  FileTextIcon,
  FolderKanbanIcon,
  FolderTreeIcon,
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

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
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
  { title: "Account", href: "/me/settings", icon: SettingsIcon },
  { title: "Security", href: "/me/security", icon: ShieldCheckIcon },
  { title: "Help and guides", href: "/items", icon: BookOpenCheckIcon },
];

export const personalNavigation: NavigationGroup[] = [
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

export const personalSettingsNavigation: NavigationGroup[] = [
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

const getFamilyMoneyChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "Overview",
    href: `${familyHref}/money`,
    icon: BadgeDollarSignIcon,
    exact: true,
  },
  {
    title: "Income",
    href: `${familyHref}/money/income`,
    icon: ArrowDownIcon,
  },
  {
    title: "Expenses",
    href: `${familyHref}/money/expenses`,
    icon: ArrowUpIcon,
  },
  {
    title: "Categories",
    href: `${familyHref}/money/categories`,
    icon: FolderTreeIcon,
  },
  {
    title: "Approvals",
    href: `${familyHref}/money/approvals`,
    icon: FileClockIcon,
  },
  {
    title: "Receipts",
    href: `${familyHref}/money/receipts`,
    icon: ReceiptTextIcon,
  },
  {
    title: "Budgets",
    href: `${familyHref}/money/budgets`,
    icon: ListChecksIcon,
  },
  {
    title: "Loans",
    href: `${familyHref}/money/loans`,
    icon: LandmarkIcon,
  },
];

export const getFamilyNavigation = (familySlug: string): NavigationGroup[] => {
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
          items: getFamilyMoneyChildren(familyHref),
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

export const workspaceLinks = [
  { title: "Personal workspace", href: "/me", icon: WalletCardsIcon },
  { title: "All families", href: "/family", icon: UsersIcon },
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
