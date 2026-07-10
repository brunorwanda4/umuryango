import type { LucideIcon } from "lucide-react";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  LandmarkIcon,
  UserIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";

export type IncomeSourceDatum = {
  amountMinorUnits: number;
  color: string;
  name: string;
};

export type RecentIncomeRecord = {
  amountMinorUnits: number;
  category: string;
  categoryClassName: string;
  date: string;
  description: string;
  icon: LucideIcon;
  id: string;
  paymentClassName: string;
  paymentIcon: LucideIcon;
  paymentMethod: string;
  source: string;
  sourceClassName: string;
};

export const incomeOverTimeData = [
  { day: "Jul 1", amount: 19000 },
  { day: "Jul 2", amount: 25000 },
  { day: "Jul 3", amount: 22000 },
  { day: "Jul 4", amount: 31000 },
  { day: "Jul 5", amount: 23000 },
  { day: "Jul 6", amount: 26000 },
  { day: "Jul 7", amount: 24000 },
  { day: "Jul 8", amount: 29000 },
  { day: "Jul 9", amount: 37000 },
  { day: "Jul 10", amount: 27000 },
  { day: "Jul 11", amount: 31000 },
  { day: "Jul 12", amount: 39000 },
  { day: "Jul 13", amount: 44000 },
  { day: "Jul 14", amount: 40000 },
  { day: "Jul 15", amount: 58000 },
  { day: "Jul 16", amount: 43000 },
  { day: "Jul 17", amount: 51000 },
  { day: "Jul 18", amount: 66000 },
  { day: "Jul 19", amount: 56000 },
  { day: "Jul 20", amount: 64000 },
  { day: "Jul 21", amount: 78000 },
  { day: "Jul 22", amount: 72000 },
  { day: "Jul 23", amount: 84000 },
  { day: "Jul 24", amount: 91000 },
  { day: "Jul 25", amount: 76000 },
  { day: "Jul 26", amount: 65000 },
];

export const incomeSourceData: IncomeSourceDatum[] = [
  {
    amountMinorUnits: 150000,
    color: "var(--chart-2)",
    name: "Salary",
  },
  {
    amountMinorUnits: 100000,
    color: "var(--chart-1)",
    name: "Business",
  },
  {
    amountMinorUnits: 50000,
    color: "var(--chart-4)",
    name: "Contribution",
  },
  {
    amountMinorUnits: 25000,
    color: "var(--chart-5)",
    name: "Gift",
  },
  {
    amountMinorUnits: 10000,
    color: "color-mix(in oklab, var(--chart-1) 45%, var(--chart-2))",
    name: "Other",
  },
];

export const recentIncomeData: RecentIncomeRecord[] = [
  {
    amountMinorUnits: 40000,
    category: "Business",
    categoryClassName: "bg-chart-1/10 text-chart-1",
    date: "Jul 30, 2026",
    description: "Payment for design project",
    icon: BriefcaseBusinessIcon,
    id: "income-001",
    paymentClassName: "bg-chart-5 text-background",
    paymentIcon: WalletCardsIcon,
    paymentMethod: "MTN Mobile Money",
    source: "Business income",
    sourceClassName: "bg-chart-2/10 text-chart-2",
  },
  {
    amountMinorUnits: 60000,
    category: "Salary",
    categoryClassName: "bg-chart-2/10 text-chart-2",
    date: "Jul 28, 2026",
    description: "Monthly salary - July 2026",
    icon: UserIcon,
    id: "income-002",
    paymentClassName: "bg-chart-1 text-background",
    paymentIcon: LandmarkIcon,
    paymentMethod: "Bank Transfer",
    source: "Salary",
    sourceClassName: "bg-chart-2/10 text-chart-2",
  },
  {
    amountMinorUnits: 20000,
    category: "Contribution",
    categoryClassName: "bg-chart-4/10 text-chart-4",
    date: "Jul 25, 2026",
    description: "Support from family",
    icon: UsersIcon,
    id: "income-003",
    paymentClassName: "bg-chart-2 text-background",
    paymentIcon: BanknoteIcon,
    paymentMethod: "Cash",
    source: "Family support",
    sourceClassName: "bg-chart-2/10 text-chart-2",
  },
];

export const totalIncomeMinorUnits = incomeSourceData.reduce(
  (sum, source) => sum + source.amountMinorUnits,
  0,
);
