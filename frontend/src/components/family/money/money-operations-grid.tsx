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
      title: t("pendingApprovalsTitle"),
      description: t("pendingApprovalsDesc"),
      value:
        typeof pendingApprovalCount === "number"
          ? pendingApprovalCount.toLocaleString()
          : t("noQueue"),
      icon: FileClockIcon,
      capability: "APPROVE_EXPENSE",
    },
    {
      title: t("overdueWorkTitle"),
      description: t("overdueWorkDesc"),
      value:
        typeof overdueCount === "number"
          ? overdueCount.toLocaleString()
          : t("none"),
      icon: AlertCircleIcon,
    },
    {
      title: t("auditReadinessTitle"),
      description: t("auditReadinessDesc"),
      value: money?.generatedAt ? t("traceable") : t("pendingApi"),
      icon: ShieldCheckIcon,
    },
    {
      title: t("reportSourceTitle"),
      description: t("reportSourceDesc"),
      value: t("recordsCount", { count: money?.sourceRecordCount ?? 0 }),
      icon: CheckCircle2Icon,
      capability: "VIEW_REPORTS",
    },
  ];

  return (
    <section
      aria-label={t("operationsAria")}
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
