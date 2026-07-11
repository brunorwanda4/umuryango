import {
  formatOptionalCompactMinorUnits,
  formatCompactMinorUnits as formatSharedCompactMinorUnits,
} from "@/lib/format-compact-number";
import type {
  MoneyMinorValue,
  ProjectRow,
  ProjectStatusFilter,
  ProjectsOverview,
} from "./types";

export const statusLabels: Record<ProjectStatusFilter, string> = {
  active: "Active",
  planned: "Planned",
  completed: "Completed",
  all: "All projects",
};

export const summarySkeletonKeys = [
  "planned",
  "contributed",
  "outstanding",
  "active",
  "overdue",
  "contributors",
];

export function normalizeProjectsOverview(
  projects?: ProjectsOverview,
): ProjectsOverview | null {
  if (!projects) {
    return null;
  }

  return {
    ...projects,
    projects: Array.isArray(projects.projects) ? projects.projects : [],
    contributions: Array.isArray(projects.contributions)
      ? projects.contributions
      : [],
    updates: Array.isArray(projects.updates) ? projects.updates : [],
  };
}

export function formatOptionalMoney(
  value: MoneyMinorValue | null | undefined,
  currency: string,
) {
  return formatOptionalCompactMinorUnits(value, currency);
}

export function formatMinorUnits(value: unknown, currency: string) {
  return formatSharedCompactMinorUnits(value as MoneyMinorValue, currency);
}

export function clampPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function formatTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not dated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function createProjectSlug(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

export function findProjectByRouteSlug(
  projects: ProjectRow[],
  routeSlug: string,
) {
  const normalizedRouteSlug = safeDecodeURIComponent(routeSlug).toLowerCase();

  return projects.find(
    (project) =>
      project.id.toLowerCase() === normalizedRouteSlug ||
      createProjectSlug(project.name) === normalizedRouteSlug,
  );
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
