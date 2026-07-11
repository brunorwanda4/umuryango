import type { SidebarIconSource } from "./sidebar-icon";

const sidebarIcon = (name: string): SidebarIconSource => ({
  src: `/images/icons/${name}.png`,
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
  { title: "Account", href: "/me/settings", icon: sidebarIcon("account") },
  { title: "Security", href: "/me/security", icon: sidebarIcon("security") },
  { title: "Help and guides", href: "/items", icon: sidebarIcon("help") },
];

export const personalNavigation: NavigationGroup[] = [
  {
    label: "Personal",
    items: [
      { title: "Overview", href: "/me", icon: sidebarIcon("dashboard") },
      { title: "My money", href: "/me/money", icon: sidebarIcon("money") },
      { title: "Plans", href: "/me/plans", icon: sidebarIcon("plan") },
      {
        title: "Savings goals",
        href: "/me/savings",
        icon: sidebarIcon("savings"),
      },
      { title: "Debts", href: "/me/debts", icon: sidebarIcon("debt") },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Documents",
        href: "/me/documents",
        icon: sidebarIcon("documents"),
      },
      {
        title: "Family workspaces",
        href: "/family",
        icon: sidebarIcon("family"),
      },
      {
        title: "Settings",
        href: "/me/settings",
        icon: sidebarIcon("settings"),
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
        icon: sidebarIcon("account"),
        exact: true,
      },
      {
        title: "Security",
        href: "/me/security",
        icon: sidebarIcon("security"),
      },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Help and guides", href: "/items", icon: sidebarIcon("help") },
    ],
  },
];

const getFamilySettingsChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "General",
    href: `${familyHref}/settings/general`,
    icon: sidebarIcon("settings"),
  },
  {
    title: "Members and access",
    href: `${familyHref}/settings/members`,
    icon: sidebarIcon("members"),
  },
  {
    title: "Audit",
    href: `${familyHref}/settings/audit`,
    icon: sidebarIcon("audit"),
  },
];

const getFamilyMoneyChildren = (familyHref: string): NavigationItem[] => [
  {
    title: "Overview",
    href: `${familyHref}/money`,
    icon: sidebarIcon("money"),
    exact: true,
  },
  {
    title: "Income",
    href: `${familyHref}/money/income`,
    icon: sidebarIcon("income"),
  },
  {
    title: "Expenses",
    href: `${familyHref}/money/expenses`,
    icon: sidebarIcon("expense"),
  },
  {
    title: "Categories",
    href: `${familyHref}/money/categories`,
    icon: sidebarIcon("categories"),
  },
  {
    title: "Approvals",
    href: `${familyHref}/money/approvals`,
    icon: sidebarIcon("approved"),
  },
  {
    title: "Loans",
    href: `${familyHref}/money/loans`,
    icon: sidebarIcon("loan"),
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
          icon: sidebarIcon("dashboard"),
        },
        {
          title: "Money",
          href: `${familyHref}/money`,
          icon: sidebarIcon("money"),
          items: getFamilyMoneyChildren(familyHref),
        },
        {
          title: "Projects",
          href: `${familyHref}/projects`,
          icon: sidebarIcon("projects"),
        },
        {
          title: "Reports",
          href: `${familyHref}/reports`,
          icon: sidebarIcon("reports"),
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Events",
          href: `${familyHref}/events`,
          icon: sidebarIcon("calendar"),
        },
        {
          title: "Announcements",
          href: `${familyHref}/announcements`,
          icon: sidebarIcon("announcement"),
        },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: sidebarIcon("documents"),
        },
        {
          title: "Contacts",
          href: `${familyHref}/contacts`,
          icon: sidebarIcon("contacts"),
        },
        {
          title: "Members",
          href: `${familyHref}/members`,
          icon: sidebarIcon("members"),
        },
        {
          title: "Settings",
          href: `${familyHref}/settings`,
          icon: sidebarIcon("settings"),
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
          icon: sidebarIcon("members"),
        },
        {
          title: "Documents",
          href: `${familyHref}/documents`,
          icon: sidebarIcon("documents"),
        },
      ],
    },
  ];
};

export const workspaceLinks = [
  { title: "Personal workspace", href: "/me", icon: sidebarIcon("account") },
  { title: "All families", href: "/family", icon: sidebarIcon("family") },
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
