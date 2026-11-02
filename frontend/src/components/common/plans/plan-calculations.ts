import type { SharedPlanItem, SharedPlanSummary } from "./types";

export function getCategoryEmoji(
  category?: string | null,
  title?: string,
  customEmoji?: string | null,
): string {
  if (customEmoji) {
    return customEmoji;
  }
  const text = `${category || ""} ${title || ""}`.toLowerCase();
  if (text.includes("car") || text.includes("vehicle") || text.includes("auto"))
    return "🚗";
  if (
    text.includes("house") ||
    text.includes("home") ||
    text.includes("plot") ||
    text.includes("land") ||
    text.includes("construction")
  )
    return "🏡";
  if (
    text.includes("emergency") ||
    text.includes("health") ||
    text.includes("buffer") ||
    text.includes("hospital") ||
    text.includes("medical")
  )
    return "🛡️";
  if (
    text.includes("school") ||
    text.includes("exam") ||
    text.includes("education") ||
    text.includes("degree") ||
    text.includes("course") ||
    text.includes("cert")
  )
    return "🎓";
  if (
    text.includes("business") ||
    text.includes("shop") ||
    text.includes("stock") ||
    text.includes("investment")
  )
    return "💼";
  if (
    text.includes("wedding") ||
    text.includes("event") ||
    text.includes("party") ||
    text.includes("anniversary")
  )
    return "🎉";
  return "🎯";
}

export function calculatePlanSummary(
  items: SharedPlanItem[],
  currency: string,
): SharedPlanSummary {
  let totalTarget = BigInt(0);
  let totalCurrent = BigInt(0);
  let totalRemaining = BigInt(0);
  let activeCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let hasFinancials = false;

  for (const item of items) {
    if (item.isFinancial && item.targetAmountMinorUnits) {
      hasFinancials = true;
      const target = BigInt(item.targetAmountMinorUnits || "0");
      const current = BigInt(item.currentAmountMinorUnits || "0");
      totalTarget += target;
      totalCurrent += current;
      if (target > current) {
        totalRemaining += target - current;
      }
    }

    if (item.isCompleted || item.status === "COMPLETED") {
      completedCount += 1;
    } else if (item.status !== "CANCELLED" && item.status !== "ARCHIVED") {
      activeCount += 1;
    }

    if (item.isOverdue) {
      overdueCount += 1;
    }
  }

  let progressPercent = 0;
  if (hasFinancials && totalTarget > BigInt(0)) {
    progressPercent = Math.min(
      100,
      Number((totalCurrent * BigInt(100)) / totalTarget),
    );
  } else if (items.length > 0) {
    progressPercent = Math.min(
      100,
      Math.round((completedCount * 100) / items.length),
    );
  }

  return {
    currency,
    hasFinancials,
    totalTargetMinorUnits: totalTarget,
    totalCurrentMinorUnits: totalCurrent,
    totalRemainingMinorUnits: totalRemaining,
    progressPercent,
    activeCount,
    completedCount,
    overdueCount,
    totalCount: items.length,
  };
}

export function formatTargetTimeline(
  dateString: string | null | undefined,
  isCompleted = false,
  referenceDate = new Date(),
): { label: string; isOverdue: boolean } {
  if (!dateString) {
    return { label: "No date set", isOverdue: false };
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { label: "Invalid date", isOverdue: false };
  }

  if (isCompleted) {
    const dateFormatted = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
    return { label: `Completed (${dateFormatted})`, isOverdue: false };
  }

  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffMs = startOfDate.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const shortDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label:
        overdueDays === 1
          ? "Overdue by 1 day"
          : `Overdue by ${overdueDays} days`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { label: "Due today", isOverdue: false };
  }

  if (diffDays <= 30) {
    return {
      label:
        diffDays === 1
          ? `Due tomorrow (${shortDate})`
          : `Due in ${diffDays} days (${shortDate})`,
      isOverdue: false,
    };
  }

  const fullDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return { label: `Target: ${fullDate}`, isOverdue: false };
}

const KNOWN_TABS = new Set([
  "all",
  "savings",
  "goals",
  "tasks",
  "active",
  "planned",
  "completed",
  "kinship",
]);

export function filterSharedPlans(
  items: SharedPlanItem[],
  arg1 = "all",
  arg2 = "",
): SharedPlanItem[] {
  let tabId = "all";
  let search = "";

  if (KNOWN_TABS.has(arg1)) {
    tabId = arg1;
    search = arg2;
  } else if (KNOWN_TABS.has(arg2)) {
    tabId = arg2;
    search = arg1;
  } else {
    search = arg1;
    tabId = arg2 || "all";
  }

  const query = search.trim().toLowerCase();

  return items.filter((item) => {
    // 1. Tab filter
    if (tabId !== "all") {
      if (tabId === "savings" || tabId === "goals") {
        if (!item.isFinancial) return false;
      } else if (tabId === "tasks") {
        if (item.isFinancial) return false;
      } else if (tabId === "active") {
        if (
          item.isCompleted ||
          item.status === "COMPLETED" ||
          item.status === "CANCELLED"
        )
          return false;
      } else if (tabId === "planned") {
        if (item.status !== "PLANNED" && item.status !== "PENDING")
          return false;
      } else if (tabId === "completed") {
        if (!item.isCompleted && item.status !== "COMPLETED") return false;
      } else if (tabId === "kinship") {
        const cat = (item.category || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        if (
          !cat.includes("kinship") &&
          !cat.includes("emergency") &&
          !desc.includes("kinship")
        ) {
          return false;
        }
      }
    }

    // 2. Search query
    if (query) {
      const match =
        item.title.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false) ||
        (item.category?.toLowerCase().includes(query) ?? false) ||
        (item.ownerOrSubtitle?.toLowerCase().includes(query) ?? false);

      if (!match) return false;
    }

    return true;
  });
}
