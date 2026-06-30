import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileClockIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type FamilyCapability, hasCapability } from "@/lib/family-access";
import type { MoneyOverview } from "./types";

export function MoneyOperationsGrid({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const pendingApprovalCount = money?.totals?.pendingApprovalCount;
  const overdueCount = money?.totals?.overdueCount;
  const items: {
    title: string;
    description: string;
    value: string;
    icon: typeof FileClockIcon;
    capability?: FamilyCapability;
  }[] = [
    {
      title: "Pending approvals",
      description: "Expenses, income, and corrections waiting for review.",
      value:
        typeof pendingApprovalCount === "number"
          ? pendingApprovalCount.toLocaleString()
          : "No queue",
      icon: FileClockIcon,
      capability: "APPROVE_EXPENSE",
    },
    {
      title: "Overdue money work",
      description: "Debts, contributions, or budget reviews past due.",
      value:
        typeof overdueCount === "number"
          ? overdueCount.toLocaleString()
          : "None",
      icon: AlertCircleIcon,
    },
    {
      title: "Audit readiness",
      description: "Sensitive money changes require backend audit records.",
      value: money?.generatedAt ? "Traceable" : "Pending API",
      icon: ShieldCheckIcon,
    },
    {
      title: "Report source",
      description: "Reports must be generated from persisted records.",
      value: `${money?.sourceRecordCount ?? 0} records`,
      icon: CheckCircle2Icon,
      capability: "VIEW_REPORTS",
    },
  ];

  return (
    <section
      aria-label="Money operations"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items
        .filter(
          (item) => !item.capability || hasCapability(family, item.capability),
        )
        .map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardHeader>
                <CardAction>
                  <Icon className="size-4 text-muted-foreground" />
                </CardAction>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-2xl tracking-tight">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
    </section>
  );
}
