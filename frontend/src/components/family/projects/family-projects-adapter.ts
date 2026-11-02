import {
  formatTargetTimeline,
  getCategoryEmoji,
} from "@/components/common/plans/plan-calculations";
import type {
  SharedPlanItem,
  SharedPlanSummary,
} from "@/components/common/plans/types";
import type { ProjectRow, ProjectsOverview } from "./types";
import { createProjectSlug } from "./utils";

export function adaptFamilyProjectToSharedItem(
  project: ProjectRow,
  familyName: string,
  currency = "RWF",
): SharedPlanItem {
  const isCompleted = project.status?.toLowerCase() === "completed";
  const isPlanned = project.status?.toLowerCase() === "planned";

  const targetTimeline = formatTargetTimeline(project.targetDate, isCompleted);
  const targetDateLabel = targetTimeline.label;
  const isOverdue = targetTimeline.isOverdue;
  const category = project.category || "Project";
  const iconEmoji = getCategoryEmoji(category, project.name);

  // Financial values
  const targetMinor =
    project.targetAmountMinorUnits != null
      ? BigInt(project.targetAmountMinorUnits)
      : BigInt(0);
  const contributedMinor =
    project.contributedMinorUnits != null
      ? BigInt(project.contributedMinorUnits)
      : BigInt(0);

  let remainingMinorStr: string | null = null;
  if (project.outstandingMinorUnits != null) {
    remainingMinorStr = project.outstandingMinorUnits.toString();
  } else if (targetMinor > BigInt(0)) {
    const diff = targetMinor - contributedMinor;
    remainingMinorStr = (diff > BigInt(0) ? diff : BigInt(0)).toString();
  }

  // Progress percent
  let progressPercent = project.percentFunded ?? 0;
  if (
    progressPercent === 0 &&
    targetMinor > BigInt(0) &&
    contributedMinor > BigInt(0)
  ) {
    progressPercent = Math.min(
      100,
      Math.max(0, Number((contributedMinor * BigInt(100)) / targetMinor)),
    );
  } else if (isCompleted) {
    progressPercent = 100;
  }

  const rawStatus = project.status || "active";
  const statusLabel =
    rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

  const statusVariant = isCompleted
    ? "secondary"
    : isPlanned
      ? "outline"
      : "default";

  const slug = createProjectSlug(project.name);
  const href = `/family/${encodeURIComponent(familyName)}/projects/${encodeURIComponent(slug)}`;

  return {
    id: project.id,
    title: project.name,
    description: project.description,
    category,
    iconEmoji,
    status: rawStatus.toUpperCase(),
    statusLabel,
    statusVariant,
    isOverdue,
    isCompleted,
    isFinancial: targetMinor > BigInt(0) || contributedMinor > BigInt(0),
    targetAmountMinorUnits: targetMinor.toString(),
    currentAmountMinorUnits: contributedMinor.toString(),
    remainingAmountMinorUnits: remainingMinorStr,
    currency,
    progressPercent,
    targetDate: project.targetDate,
    targetDateLabel,
    ownerOrSubtitle: project.ownerName || category,
    memberCount: project.memberCount,
    href,
    primaryAction: {
      label: "View",
      onClick: () => {
        window.location.href = href;
      },
    },
  };
}

export function adaptFamilyProjectsSummary(
  overview: ProjectsOverview | null | undefined,
  currency = "RWF",
): SharedPlanSummary {
  const totals = overview?.totals;
  const totalTarget = BigInt(totals?.plannedMinorUnits ?? 0);
  const totalCurrent = BigInt(totals?.contributedMinorUnits ?? 0);
  const totalRemaining = BigInt(totals?.outstandingMinorUnits ?? 0);

  let progressPercent = 0;
  if (totalTarget > BigInt(0)) {
    progressPercent = Math.min(
      100,
      Math.max(0, Number((totalCurrent * BigInt(100)) / totalTarget)),
    );
  }

  const projects = overview?.projects || [];
  const completedCount = projects.filter(
    (p) => p.status?.toLowerCase() === "completed",
  ).length;

  return {
    currency: overview?.currency || currency,
    hasFinancials: totalTarget > BigInt(0) || totalCurrent > BigInt(0),
    totalTargetMinorUnits: totalTarget,
    totalCurrentMinorUnits: totalCurrent,
    totalRemainingMinorUnits: totalRemaining,
    progressPercent,
    activeCount: totals?.activeProjectCount ?? projects.length,
    completedCount,
    overdueCount: totals?.overdueProjectCount ?? 0,
    totalCount: projects.length,
  };
}
