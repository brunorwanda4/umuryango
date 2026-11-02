import type { ComponentType } from "react";

export type SharedPlanAction = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline";
  destructive?: boolean;
};

export type SharedPlanItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  iconEmoji?: string | null;
  status: string; // e.g. "ACTIVE", "IN_PROGRESS", "PLANNED", "COMPLETED", "OVERDUE", "CANCELLED", "PAUSED"
  statusLabel: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  isOverdue?: boolean;
  isCompleted?: boolean;
  isFinancial: boolean;
  targetAmountMinorUnits?: string | null;
  currentAmountMinorUnits?: string | null;
  remainingAmountMinorUnits?: string | null;
  currency: string;
  progressPercent: number; // 0 to 100
  targetDate?: string | null;
  targetDateLabel?: string | null;
  ownerOrSubtitle?: string | null;
  memberCount?: number | null;
  milestonesCount?: { completed: number; total: number } | null;
  href?: string;
  primaryAction?: SharedPlanAction;
  menuActions?: SharedPlanAction[];
  onCardClick?: () => void;
  taskCheckable?: {
    checked: boolean;
    onToggle: () => void;
  };
};

export type SharedPlanSummary = {
  currency: string;
  hasFinancials: boolean;
  totalTargetMinorUnits: bigint;
  totalCurrentMinorUnits: bigint;
  totalRemainingMinorUnits: bigint;
  progressPercent: number;
  activeCount: number;
  completedCount: number;
  overdueCount: number;
  totalCount: number;
};

export type SharedPlanFilterTab = {
  id: string;
  label: string;
  count?: number;
};
