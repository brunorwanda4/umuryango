import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CarIcon,
  CircleDollarSignIcon,
  GiftIcon,
  HeartPulseIcon,
  HomeIcon,
  LandmarkIcon,
  type LucideIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
  WalletCardsIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTitle } from "./utils";

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant="outline">{formatTitle(value)}</Badge>;
}

export function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "PAID":
    case "COMPLETED":
      return "default";
    case "PENDING":
    case "PARTIAL":
    case "DRAFT":
      return "secondary";
    case "REJECTED":
    case "OVERDUE":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export function getTransactionCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("salary")) {
    return { icon: UserIcon, className: "bg-chart-2/10 text-chart-2" };
  }
  if (normalized.includes("business") || normalized.includes("office")) {
    return {
      icon: BriefcaseBusinessIcon,
      className: "bg-chart-1/10 text-chart-1",
    };
  }
  if (normalized.includes("contribution") || normalized.includes("support")) {
    return { icon: UsersIcon, className: "bg-chart-4/10 text-chart-4" };
  }
  if (normalized.includes("gift")) {
    return { icon: GiftIcon, className: "bg-chart-5/10 text-chart-5" };
  }
  if (
    normalized.includes("food") ||
    normalized.includes("grocery") ||
    normalized.includes("groceries")
  ) {
    return { icon: ShoppingCartIcon, className: "bg-chart-1/10 text-chart-1" };
  }
  if (
    normalized.includes("transport") ||
    normalized.includes("travel") ||
    normalized.includes("fuel")
  ) {
    return { icon: CarIcon, className: "bg-chart-3/10 text-chart-3" };
  }
  if (
    normalized.includes("health") ||
    normalized.includes("medical") ||
    normalized.includes("clinic")
  ) {
    return { icon: HeartPulseIcon, className: "bg-chart-4/10 text-chart-4" };
  }
  if (
    normalized.includes("restaurant") ||
    normalized.includes("dining") ||
    normalized.includes("lunch") ||
    normalized.includes("dinner")
  ) {
    return { icon: UtensilsIcon, className: "bg-chart-5/10 text-chart-5" };
  }
  if (
    normalized.includes("rent") ||
    normalized.includes("house") ||
    normalized.includes("home") ||
    normalized.includes("utilities")
  ) {
    return { icon: HomeIcon, className: "bg-chart-2/10 text-chart-2" };
  }
  return {
    icon: CircleDollarSignIcon,
    className: "bg-muted text-muted-foreground",
  };
}

export function getTransactionPaymentStyle(account: string | null | undefined) {
  const normalized = (account ?? "OTHER").toUpperCase();
  if (normalized.includes("BANK")) {
    return { icon: LandmarkIcon, className: "bg-chart-1 text-background" };
  }
  if (normalized.includes("MOBILE")) {
    return { icon: SmartphoneIcon, className: "bg-chart-5 text-background" };
  }
  if (normalized.includes("CASH")) {
    return { icon: BanknoteIcon, className: "bg-chart-2 text-background" };
  }
  return { icon: WalletCardsIcon, className: "bg-muted text-foreground" };
}

export function formatTransactionPaymentMethod(
  value: string | null | undefined,
) {
  if (!value) return "Other";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ChartEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

export function TableEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}
