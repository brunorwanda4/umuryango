import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { MinorUnitValue } from "@/lib/format-compact-number";

export type MoneyDirection = "income" | "expense";

export type MoneyDirectionHeaderProps = {
  direction: MoneyDirection;
  title: ReactNode;
  eyebrow?: ReactNode;
  eyebrowIcon?: LucideIcon;
  periodLabel?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export type MoneyHeroSubmetric = {
  id: string;
  label: ReactNode;
  value: MinorUnitValue;
  countText?: ReactNode;
  indicatorColor?: "emerald" | "rose" | "amber" | "muted" | "blue" | "purple";
  variant?: "income" | "expense" | "pending" | "neutral";
};

export type MoneyHeroProgress = {
  label: ReactNode;
  percent: number; // 0-100
  percentText?: ReactNode;
  detailText?: ReactNode;
};

export type MoneyDirectionalHeroProps = {
  direction: MoneyDirection;
  currency: string;
  totalAmountMinorUnits: MinorUnitValue;
  eyebrowLabel: ReactNode;
  periodBadge?: ReactNode;
  subtitle?: ReactNode;
  progress?: MoneyHeroProgress;
  submetrics?: MoneyHeroSubmetric[];
  className?: string;
};

export type MoneyActionItem = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  iconColor?: "emerald" | "rose" | "blue" | "purple" | "zinc" | "amber";
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
};

export type MoneyActionGridProps = {
  title: ReactNode;
  description?: ReactNode;
  actions: MoneyActionItem[];
  className?: string;
};

export type MoneyCategoryItem = {
  id: string;
  name: string;
  amountMinorUnits: MinorUnitValue;
  percentage: number; // 0-100
  color?: string | null;
  count?: number;
  icon?: LucideIcon;
  subtitle?: string | null;
};

export type MoneyCategoryBreakdownProps = {
  direction: MoneyDirection;
  title: ReactNode;
  subtitle?: ReactNode;
  activeCountLabel?: ReactNode;
  currency: string;
  items: MoneyCategoryItem[];
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  onAddCategory?: () => void;
  addCategoryLabel?: ReactNode;
  className?: string;
};

export type MoneyPendingAttentionItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  dueDate?: string | null;
  date?: string | null;
  amountMinorUnits: MinorUnitValue;
  currency: string;
  status: string;
  actionLabel?: string;
  onAction?: () => void;
  onView?: () => void;
};

export type MoneyPendingAttentionProps = {
  direction: MoneyDirection;
  title: ReactNode;
  subtitle?: ReactNode;
  badgeCount?: number;
  items: MoneyPendingAttentionItem[];
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  onViewAll?: () => void;
  viewAllLabel?: ReactNode;
  className?: string;
};

export type MoneyMobileTransactionRowProps = {
  direction: MoneyDirection;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  categoryClassName?: string;
  paymentMethod?: string | null;
  paymentIcon?: LucideIcon;
  date: string;
  amountMinorUnits: MinorUnitValue;
  currency: string;
  status: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  icon?: LucideIcon;
  iconClassName?: string;
  onView?: () => void;
  actions?: ReactNode;
  extraActions?: ReactNode;
  className?: string;
};

export type MoneyLedgerFilterPill = {
  id: string;
  label: ReactNode;
  count?: number;
  active: boolean;
  onClick: () => void;
};

export type MoneyLedgerCardProps = {
  direction: MoneyDirection;
  title: ReactNode;
  entryCountLabel?: ReactNode;
  filterPills?: MoneyLedgerFilterPill[];
  filterToolbar?: ReactNode;
  viewMode?: "table" | "list";
  onViewModeChange?: (mode: "table" | "list") => void;
  children: ReactNode;
  emptyState?: ReactNode;
  hasEntries: boolean;
  className?: string;
};
