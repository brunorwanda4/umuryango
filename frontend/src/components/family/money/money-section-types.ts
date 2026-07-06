import type { LucideIcon } from "lucide-react";
import type { FamilyCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../dashboard/types";
import type { MoneyOverview } from "./types";

export type MoneySection =
  | "income"
  | "expenses"
  | "categories"
  | "approvals"
  | "receipts"
  | "loans";

export type MoneySectionHeader = {
  section: MoneySection;
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  actionCapability?: FamilyCapability;
  actionIcon: LucideIcon;
  icon: LucideIcon;
  examples: string[];
};

export type MoneyPageContext = {
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
  currency: string;
};
