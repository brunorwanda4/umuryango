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
import { createTranslator } from "@/i18n/translate";
import { type FamilyCapability, hasCapability } from "@/lib/family-access";
import type { MoneyOverview } from "./types";

export function MoneyOperationsGrid({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const t = createTranslator("FamilyMoney");
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
      title: t((m) => m.FamilyMoney.pendingApprovalsTitle),
      description: t((m) => m.FamilyMoney.pendingApprovalsDesc),
      value:
        typeof pendingApprovalCount === "number"
          ? pendingApprovalCount.toLocaleString()
          : t((m) => m.FamilyMoney.noQueue),
      icon: FileClockIcon,
      capability: "APPROVE_EXPENSE",
    },
    {
      title: t((m) => m.FamilyMoney.overdueWorkTitle),
      description: t((m) => m.FamilyMoney.overdueWorkDesc),
      value:
        typeof overdueCount === "number"
          ? overdueCount.toLocaleString()
          : t((m) => m.FamilyMoney.none),
      icon: AlertCircleIcon,
    },
    {
      title: t((m) => m.FamilyMoney.auditReadinessTitle),
      description: t((m) => m.FamilyMoney.auditReadinessDesc),
      value: money?.generatedAt
        ? t((m) => m.FamilyMoney.traceable)
        : t((m) => m.FamilyMoney.pendingApi),
      icon: ShieldCheckIcon,
    },
    {
      title: t((m) => m.FamilyMoney.reportSourceTitle),
      description: t((m) => m.FamilyMoney.reportSourceDesc),
      value: t((m) => m.FamilyMoney.recordsCount, {
        count: money?.sourceRecordCount ?? 0,
      }),
      icon: CheckCircle2Icon,
      capability: "VIEW_REPORTS",
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyMoney.operationsAria)}
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
