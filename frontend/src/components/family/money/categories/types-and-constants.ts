import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArchiveIcon,
  BanknoteIcon,
  BriefcaseBusinessIcon,
  BusIcon,
  CircleDollarSignIcon,
  CircleIcon,
  CoinsIcon,
  FolderCogIcon,
  FuelIcon,
  GiftIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HeartPulseIcon,
  HomeIcon,
  LandmarkIcon,
  type LucideIcon,
  PlusIcon,
  ShieldIcon,
  ShirtIcon,
  TractorIcon,
  UtensilsIcon,
  WifiIcon,
  WrenchIcon,
} from "lucide-react";
import { z } from "zod";
import type { MoneySectionHeader } from "../money-section-types";
import type { MoneyMinorValue, MoneyOverview } from "../types";
import { normalizeMinorUnitString } from "../utils";

export type CategoryType = "INCOME" | "EXPENSE";
export type CategoryStatus = "ACTIVE" | "INACTIVE";
export type CategorySort =
  | "name-asc"
  | "updated-desc"
  | "transactions-desc"
  | "total-desc";

export type MoneyCategory = {
  id: string;
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  color: string;
  description: string;
  status: CategoryStatus;
  isDefault?: boolean;
  transactionsCount: number;
  totalMinorUnits: MoneyMinorValue;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  source: "api" | "demo";
};

export type ApiCategory = {
  id: string;
  name: string;
  type: CategoryType | "BOTH";
  description?: string | null;
  icon?: CategoryIconName | null;
  color?: string | null;
  status?: CategoryStatus | null;
  isDefault?: boolean | null;
  transactionCount?: number | null;
  transactionsCount?: number | null;
  totalAmountMinorUnits?: MoneyMinorValue | null;
  totalMinorUnits?: MoneyMinorValue | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const categoryHeader: MoneySectionHeader = {
  section: "categories",
  title: "Money Categories",
  eyebrow: "Master data",
  description:
    "Manage reusable income and expense categories that administrators select when recording family transactions. This page configures the money modules; it is not used to record income or expenses.",
  actionLabel: "Create category",
  actionCapability: "MANAGE_FAMILY_SETTINGS",
  actionIcon: PlusIcon,
  icon: FolderCogIcon,
  examples: [
    "Reusable expense categories",
    "Reusable income categories",
    "Inactive categories kept for history",
  ],
};

export const categoryIconMap = {
  Banknote: BanknoteIcon,
  Briefcase: BriefcaseBusinessIcon,
  Bus: BusIcon,
  Circle: CircleIcon,
  Coins: CoinsIcon,
  "Circle dollar": CircleDollarSignIcon,
  Fuel: FuelIcon,
  Gift: GiftIcon,
  "Graduation cap": GraduationCapIcon,
  "Hand coins": HandCoinsIcon,
  "Heart pulse": HeartPulseIcon,
  Home: HomeIcon,
  Landmark: LandmarkIcon,
  Shield: ShieldIcon,
  Shirt: ShirtIcon,
  Tractor: TractorIcon,
  Utensils: UtensilsIcon,
  Wifi: WifiIcon,
  Wrench: WrenchIcon,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof categoryIconMap;

export const categoryColors = [
  "var(--primary)",
  "var(--muted-foreground)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function category(
  id: string,
  name: string,
  type: CategoryType,
  icon: CategoryIconName,
  colorIndex: number,
  description: string,
  status: CategoryStatus,
  isDefault: boolean,
  transactionsCount: number,
  totalMinorUnits: number,
  createdBy: string,
  createdAt: string,
  updatedAt: string,
): MoneyCategory {
  return {
    color: categoryColors[colorIndex % categoryColors.length],
    createdAt,
    createdBy,
    description,
    icon,
    id,
    isDefault,
    name,
    source: "demo",
    status,
    totalMinorUnits,
    transactionsCount,
    type,
    updatedAt,
  };
}

export const demoCategories: MoneyCategory[] = [
  category(
    "expense-food",
    "Food",
    "EXPENSE",
    "Utensils",
    0,
    "Groceries, market shopping, and meals for family activities.",
    "ACTIVE",
    true,
    42,
    3_840_000,
    "Aline Uwimana",
    "2026-01-03",
    "2026-06-27",
  ),
  category(
    "expense-rent",
    "House Rent",
    "EXPENSE",
    "Home",
    1,
    "Rent paid for family housing or rooms used by dependents.",
    "ACTIVE",
    true,
    6,
    4_500_000,
    "Jean Baptiste",
    "2026-01-08",
    "2026-06-01",
  ),
  category(
    "expense-school",
    "School Fees",
    "EXPENSE",
    "Graduation cap",
    2,
    "Tuition, uniforms, books, and school contribution payments.",
    "ACTIVE",
    true,
    11,
    2_980_000,
    "Aline Uwimana",
    "2026-01-13",
    "2026-06-20",
  ),
  category(
    "expense-transport",
    "Transport",
    "EXPENSE",
    "Bus",
    3,
    "Bus fares, moto rides, taxi trips, and travel for family errands.",
    "ACTIVE",
    false,
    26,
    920_000,
    "Eric Niyonsenga",
    "2026-02-04",
    "2026-06-26",
  ),
  category(
    "expense-fuel",
    "Fuel",
    "EXPENSE",
    "Fuel",
    4,
    "Vehicle fuel used for family visits, events, and project work.",
    "ACTIVE",
    false,
    14,
    1_260_000,
    "Jean Baptiste",
    "2026-02-05",
    "2026-06-15",
  ),
  category(
    "expense-healthcare",
    "Healthcare",
    "EXPENSE",
    "Heart pulse",
    5,
    "Medication, insurance gap payments, clinics, and emergency care.",
    "ACTIVE",
    false,
    8,
    1_440_000,
    "Claudine Mukamana",
    "2026-02-11",
    "2026-06-24",
  ),
  category(
    "expense-utilities",
    "Utilities",
    "EXPENSE",
    "Home",
    6,
    "Water, electricity, cooking gas, and shared home services.",
    "ACTIVE",
    false,
    18,
    1_125_000,
    "Aline Uwimana",
    "2026-02-18",
    "2026-06-18",
  ),
  category(
    "expense-internet",
    "Internet",
    "EXPENSE",
    "Wifi",
    0,
    "Data bundles, home internet, and communication subscriptions.",
    "ACTIVE",
    false,
    10,
    360_000,
    "Eric Niyonsenga",
    "2026-03-02",
    "2026-06-10",
  ),
  category(
    "expense-clothing",
    "Clothing",
    "EXPENSE",
    "Shirt",
    1,
    "Clothes and shoes bought for family members.",
    "ACTIVE",
    false,
    7,
    680_000,
    "Claudine Mukamana",
    "2026-03-09",
    "2026-05-29",
  ),
  category(
    "expense-maintenance",
    "Home Maintenance",
    "EXPENSE",
    "Wrench",
    2,
    "Repairs, paint, small construction supplies, and household fixes.",
    "ACTIVE",
    false,
    9,
    1_170_000,
    "Jean Baptiste",
    "2026-03-16",
    "2026-06-11",
  ),
  category(
    "expense-farming",
    "Farming",
    "EXPENSE",
    "Tractor",
    3,
    "Seeds, fertilizer, labor, tools, livestock care, and harvest support.",
    "ACTIVE",
    false,
    13,
    2_350_000,
    "Patrick Habimana",
    "2026-03-22",
    "2026-06-19",
  ),
  category(
    "expense-business",
    "Business Expenses",
    "EXPENSE",
    "Briefcase",
    4,
    "Stock purchases, transport, permits, and operating costs.",
    "ACTIVE",
    false,
    12,
    2_760_000,
    "Patrick Habimana",
    "2026-03-27",
    "2026-06-22",
  ),
  category(
    "expense-taxes",
    "Taxes",
    "EXPENSE",
    "Landmark",
    5,
    "Taxes, local dues, and official fees.",
    "ACTIVE",
    false,
    3,
    410_000,
    "Jean Baptiste",
    "2026-04-02",
    "2026-05-12",
  ),
  category(
    "expense-insurance",
    "Insurance",
    "EXPENSE",
    "Shield",
    6,
    "Health, vehicle, property, and family protection premiums.",
    "ACTIVE",
    false,
    4,
    520_000,
    "Claudine Mukamana",
    "2026-04-10",
    "2026-06-03",
  ),
  category(
    "expense-loan",
    "Loan Repayment",
    "EXPENSE",
    "Hand coins",
    0,
    "Loan principal and interest repayments made by the family.",
    "ACTIVE",
    false,
    6,
    1_950_000,
    "Jean Baptiste",
    "2026-04-18",
    "2026-06-17",
  ),
  category(
    "expense-emergency",
    "Emergency",
    "EXPENSE",
    "Circle dollar",
    1,
    "Urgent support that needs clear audit history.",
    "ACTIVE",
    true,
    5,
    880_000,
    "Aline Uwimana",
    "2026-04-24",
    "2026-06-28",
  ),
  category(
    "expense-entertainment",
    "Entertainment",
    "EXPENSE",
    "Gift",
    2,
    "Celebrations, family outings, and non-essential activities.",
    "INACTIVE",
    false,
    2,
    160_000,
    "Eric Niyonsenga",
    "2026-05-01",
    "2026-05-30",
  ),
  category(
    "expense-other",
    "Other",
    "EXPENSE",
    "Circle",
    3,
    "Fallback expense category for records that need later cleanup.",
    "ACTIVE",
    true,
    1,
    45_000,
    "Aline Uwimana",
    "2026-05-05",
    "2026-06-09",
  ),
  category(
    "income-salary",
    "Salary",
    "INCOME",
    "Banknote",
    4,
    "Employment income received by family members.",
    "ACTIVE",
    true,
    7,
    8_400_000,
    "Aline Uwimana",
    "2026-01-06",
    "2026-06-25",
  ),
  category(
    "income-business",
    "Business Income",
    "INCOME",
    "Briefcase",
    5,
    "Income from shops, trading, services, and family businesses.",
    "ACTIVE",
    true,
    16,
    5_760_000,
    "Patrick Habimana",
    "2026-01-12",
    "2026-06-29",
  ),
  category(
    "income-farming",
    "Farming Income",
    "INCOME",
    "Tractor",
    6,
    "Harvest sales, livestock income, and agricultural support.",
    "ACTIVE",
    false,
    8,
    3_200_000,
    "Patrick Habimana",
    "2026-02-02",
    "2026-06-13",
  ),
  category(
    "income-rental",
    "Rental Income",
    "INCOME",
    "Home",
    0,
    "Rent collected from family property or rooms.",
    "ACTIVE",
    false,
    6,
    2_700_000,
    "Jean Baptiste",
    "2026-02-12",
    "2026-06-01",
  ),
  category(
    "income-freelance",
    "Freelance",
    "INCOME",
    "Briefcase",
    1,
    "Short-term work, consulting, and independent service payments.",
    "ACTIVE",
    false,
    4,
    980_000,
    "Eric Niyonsenga",
    "2026-03-06",
    "2026-06-16",
  ),
  category(
    "income-investment",
    "Investment",
    "INCOME",
    "Coins",
    2,
    "Interest, dividends, and investment returns.",
    "ACTIVE",
    false,
    3,
    630_000,
    "Jean Baptiste",
    "2026-03-15",
    "2026-06-08",
  ),
  category(
    "income-contribution",
    "Family Contribution",
    "INCOME",
    "Hand coins",
    3,
    "Member contributions transferred into family money records.",
    "ACTIVE",
    true,
    24,
    6_120_000,
    "Aline Uwimana",
    "2026-03-23",
    "2026-06-30",
  ),
  category(
    "income-donations",
    "Donations",
    "INCOME",
    "Gift",
    4,
    "Support received from friends, relatives, or community groups.",
    "ACTIVE",
    false,
    5,
    780_000,
    "Claudine Mukamana",
    "2026-04-01",
    "2026-06-05",
  ),
  category(
    "income-gifts",
    "Gifts",
    "INCOME",
    "Gift",
    5,
    "Personal gifts received and recorded for family transparency.",
    "ACTIVE",
    false,
    2,
    220_000,
    "Claudine Mukamana",
    "2026-04-19",
    "2026-05-25",
  ),
  category(
    "income-pension",
    "Pension",
    "INCOME",
    "Shield",
    6,
    "Pension or retirement support income.",
    "INACTIVE",
    false,
    0,
    0,
    "Jean Baptiste",
    "2026-05-11",
    "2026-05-11",
  ),
  category(
    "income-other",
    "Other",
    "INCOME",
    "Circle",
    0,
    "Fallback income category for records that need later cleanup.",
    "ACTIVE",
    true,
    1,
    90_000,
    "Aline Uwimana",
    "2026-05-17",
    "2026-06-12",
  ),
];

export function enrichApiCategories(
  apiCategories: ApiCategory[],
  money: MoneyOverview | null,
): MoneyCategory[] {
  const recordsByCategory = new Map<
    string,
    { count: number; totalMinorUnits: number }
  >();

  for (const record of money?.records ?? []) {
    const key = normalizeName(record.category ?? "");
    const amount = Number(
      normalizeMinorUnitString(record.amountMinorUnits) ?? 0,
    );
    const existing = recordsByCategory.get(key) ?? {
      count: 0,
      totalMinorUnits: 0,
    };
    existing.count += 1;
    existing.totalMinorUnits += amount;
    recordsByCategory.set(key, existing);
  }

  return apiCategories
    .flatMap((category, index) => {
      if (category.type !== "INCOME" && category.type !== "EXPENSE") {
        return [];
      }

      const usage = recordsByCategory.get(normalizeName(category.name));

      return [
        {
          color:
            category.color ?? categoryColors[index % categoryColors.length],
          createdAt: category.createdAt ?? todayIso(),
          createdBy:
            category.createdByName ??
            category.createdBy ??
            "Family administrator",
          description:
            category.description ??
            `Reusable ${category.type.toLowerCase()} category.`,
          icon:
            category.icon && category.icon in categoryIconMap
              ? category.icon
              : "Circle",
          id: category.id,
          isDefault: Boolean(category.isDefault),
          name: category.name,
          source: "api" as const,
          status: category.status ?? "ACTIVE",
          totalMinorUnits:
            category.totalMinorUnits ??
            category.totalAmountMinorUnits ??
            usage?.totalMinorUnits ??
            0,
          transactionsCount:
            category.transactionsCount ??
            category.transactionCount ??
            usage?.count ??
            0,
          type: category.type,
          updatedAt: category.updatedAt ?? category.createdAt ?? todayIso(),
        },
      ];
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function filterAndSortCategories(
  categories: MoneyCategory[],
  search: string,
  typeFilter: "ALL" | CategoryType,
  statusFilter: "ALL" | CategoryStatus,
  sort: CategorySort,
) {
  const normalizedSearch = normalizeName(search);

  return categories
    .filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeName(category.name).includes(normalizedSearch) ||
        normalizeName(category.description).includes(normalizedSearch);
      const matchesType = typeFilter === "ALL" || category.type === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" || category.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    })
    .toSorted((first, second) => {
      if (sort === "name-asc") {
        return first.name.localeCompare(second.name);
      }

      if (sort === "transactions-desc") {
        return second.transactionsCount - first.transactionsCount;
      }

      if (sort === "total-desc") {
        return (
          toMoneyNumber(second.totalMinorUnits) -
          toMoneyNumber(first.totalMinorUnits)
        );
      }

      return (
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
      );
    });
}

export function getCategoryStats(categories: MoneyCategory[]) {
  return categories.reduce(
    (stats, category) => {
      stats.total += 1;
      if (category.type === "INCOME") stats.income += 1;
      if (category.type === "EXPENSE") stats.expense += 1;
      if (category.status === "ACTIVE") stats.active += 1;
      if (category.status === "INACTIVE") stats.inactive += 1;
      return stats;
    },
    { active: 0, expense: 0, inactive: 0, income: 0, total: 0 },
  );
}

export const editCategorySchema = z.object({
  color: z.string().min(1, "Color is required"),
  description: z.string().optional(),
  icon: z.enum(
    Object.keys(categoryIconMap) as [CategoryIconName, ...CategoryIconName[]],
  ),
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export type EditCategoryFormValues = z.infer<typeof editCategorySchema>;

export function getEditCategorySchema(
  categories: MoneyCategory[],
  currentCategoryId: string | undefined,
) {
  return editCategorySchema.superRefine((values, context) => {
    const duplicate = categories.some(
      (category) =>
        category.id !== currentCategoryId &&
        category.type === values.type &&
        normalizeName(category.name) === normalizeName(values.name),
    );

    if (duplicate) {
      context.addIssue({
        code: "custom",
        message: `An ${values.type.toLowerCase()} category named "${values.name}" already exists.`,
        path: ["name"],
      });
    }
  });
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function toMoneyNumber(value: MoneyMinorValue) {
  const normalized = normalizeMinorUnitString(value);
  return normalized ? Number(normalized) : 0;
}

export function todayIso() {
  return new Date().toISOString();
}

export function formatCategoryType(type: CategoryType) {
  return type === "INCOME" ? "Income" : "Expense";
}

export function formatCategoryStatus(status: CategoryStatus) {
  return status === "ACTIVE" ? "Active" : "Inactive";
}
