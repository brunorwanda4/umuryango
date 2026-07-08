import {
  BadgeDollarSignIcon,
  BellIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ReceiptTextIcon,
  TargetIcon,
} from "lucide-react";
import {
  AUTHORITY_LABELS,
  type FamilyAuthority,
  hasCapability,
  KINSHIP_LABELS,
} from "@/lib/family-access";
import type {
  DashboardModule,
  FamilyDetail,
  FamilyMemberSummary,
} from "./types";

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    title: "Money",
    description: "Income and expenses",
    helperText: "Record what came in and what was spent.",
    segment: "money",
    icon: BadgeDollarSignIcon,
    requiredCapabilities: ["RECORD_INCOME", "RECORD_EXPENSE"],
  },
  {
    title: "Contributions",
    description: "Family payments",
    helperText: "Follow monthly and special support payments.",
    segment: "contributions",
    icon: HandCoinsIcon,
    requiredCapabilities: ["MANAGE_CONTRIBUTIONS"],
  },
  {
    title: "Savings",
    description: "Goals and milestones",
    helperText: "Track money saved for family goals.",
    segment: "savings",
    icon: TargetIcon,
    requiredCapabilities: ["MANAGE_SAVINGS"],
  },
  {
    title: "Debts",
    description: "Borrowed and lent",
    helperText: "See who owes money and what is due.",
    segment: "debts",
    icon: LandmarkIcon,
    requiredCapabilities: ["MANAGE_DEBTS"],
  },
  {
    title: "Projects",
    description: "Work and budgets",
    helperText: "Manage family projects, timelines, and costs.",
    segment: "projects",
    icon: FolderKanbanIcon,
    requiredCapabilities: ["MANAGE_PROJECTS"],
  },
  {
    title: "Events",
    description: "Dates and attendance",
    helperText: "Plan meetings, ceremonies, and reminders.",
    segment: "events",
    icon: CalendarDaysIcon,
    requiredCapabilities: ["MANAGE_EVENTS"],
  },
  {
    title: "Reports",
    description: "Trusted summaries",
    helperText: "Open reports generated from saved records.",
    segment: "reports",
    icon: ReceiptTextIcon,
    requiredCapabilities: ["VIEW_REPORTS"],
  },
  {
    title: "Announcements",
    description: "Family notices",
    helperText: "Share important messages with everyone.",
    segment: "announcements",
    icon: BellIcon,
    requiredCapabilities: ["MANAGE_ANNOUNCEMENTS"],
  },
];

export const joinedDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

const authorityOrder: FamilyAuthority[] = ["HEAD", "ADMIN", "MEMBER"];

export function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getKinshipLabel(member: FamilyMemberSummary) {
  if (!member.kinshipLabel) {
    return "Family member";
  }

  if (member.kinshipLabel === "OTHER" && member.kinshipCustom) {
    return member.kinshipCustom;
  }

  return KINSHIP_LABELS[member.kinshipLabel];
}

export function getAuthorityBreakdown(family: FamilyDetail) {
  const counts = new Map<FamilyAuthority, number>(
    authorityOrder.map((authority) => [authority, 0]),
  );

  for (const member of family.members) {
    counts.set(member.authority, (counts.get(member.authority) ?? 0) + 1);
  }

  return authorityOrder.map((authority) => ({
    authority,
    label: AUTHORITY_LABELS[authority],
    members: counts.get(authority) ?? 0,
  }));
}

export function getMemberGrowth(family: FamilyDetail) {
  const joinedMonths = family.members
    .map((member) => new Date(member.joinedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => first.getTime() - second.getTime());

  let total = 0;
  const totals = new Map<string, { label: string; total: number }>();

  for (const joinedDate of joinedMonths) {
    total += 1;
    const key = `${joinedDate.getFullYear()}-${joinedDate.getMonth()}`;
    totals.set(key, {
      label: monthFormatter.format(joinedDate),
      total,
    });
  }

  return Array.from(totals.values());
}

export function getMembersJoinedThisMonth(family: FamilyDetail) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return family.members.filter((member) => {
    const joinedAt = new Date(member.joinedAt);

    return (
      !Number.isNaN(joinedAt.getTime()) &&
      joinedAt.getMonth() === currentMonth &&
      joinedAt.getFullYear() === currentYear
    );
  }).length;
}

export function getLatestFamilyActivityDate(family: FamilyDetail) {
  const dates = [
    new Date(family.createdAt),
    ...family.members.map((member) => new Date(member.joinedAt)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  if (!dates.length) {
    return null;
  }

  return dates.reduce((latest, date) =>
    date.getTime() > latest.getTime() ? date : latest,
  );
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  return `${diffYears}y ago`;
}

export function getVisibleMembers(family: FamilyDetail) {
  return family.members
    .toSorted(
      (first, second) =>
        new Date(first.joinedAt).getTime() -
        new Date(second.joinedAt).getTime(),
    )
    .slice(0, 6);
}

export function canOpenModule(family: FamilyDetail, module: DashboardModule) {
  if (module.segment !== "reports" || !module.requiredCapabilities?.length) {
    return true;
  }

  return module.requiredCapabilities.some((capability) =>
    hasCapability(family, capability),
  );
}

export function getFamilyReadiness(family: FamilyDetail) {
  const checks = [
    {
      label: "Family profile",
      complete: Boolean(family.name && family.country),
    },
    { label: "Currency selected", complete: Boolean(family.defaultCurrency) },
    {
      label: "Contribution plan",
      complete: Boolean(family.contributionCadence),
    },
    { label: "Members added", complete: family.memberCount > 1 },
  ];

  const completed = checks.filter((check) => check.complete).length;

  return {
    checks,
    completed,
    percent: Math.round((completed / checks.length) * 100),
  };
}
