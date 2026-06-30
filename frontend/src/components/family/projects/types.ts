import type { FamilyDetail } from "@/components/family/dashboard/types";

export type ProjectStatusFilter = "active" | "planned" | "completed" | "all";
export type ProjectCategory =
  | "house"
  | "vehicle"
  | "education"
  | "business"
  | "event"
  | "other";
export type MoneyMinorValue = number | string;

export type ProjectsOverview = {
  currency?: string;
  generatedAt?: string;
  sourceRecordCount?: number;
  totals?: {
    plannedMinorUnits?: MoneyMinorValue | null;
    contributedMinorUnits?: MoneyMinorValue | null;
    outstandingMinorUnits?: MoneyMinorValue | null;
    activeProjectCount?: number | null;
    overdueProjectCount?: number | null;
    contributorCount?: number | null;
  };
  projects?: ProjectRow[];
  contributions?: ProjectContributionRow[];
  updates?: ProjectUpdateRow[];
};

export type ProjectRow = {
  id: string;
  name: string;
  category?: ProjectCategory | string | null;
  description?: string | null;
  targetAmountMinorUnits?: MoneyMinorValue | null;
  contributedMinorUnits?: MoneyMinorValue | null;
  outstandingMinorUnits?: MoneyMinorValue | null;
  percentFunded?: number | null;
  startDate?: string | null;
  targetDate?: string | null;
  status?: string | null;
  ownerName?: string | null;
  memberCount?: number | null;
  contributionStrategy?: string | null;
};

export type ProjectContributionRow = {
  id: string;
  projectName: string;
  contributorName: string;
  amountMinorUnits?: MoneyMinorValue | null;
  paidAt?: string | null;
  status?: string | null;
};

export type ProjectUpdateRow = {
  id: string;
  projectName: string;
  title: string;
  body?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
};

export type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      family: FamilyDetail;
      projects: ProjectsOverview | null;
      projectsMessage?: string;
    };
