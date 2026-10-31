import {
  CheckCircle2Icon,
  DownloadIcon,
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
import { hasCapability } from "@/lib/family-access";
import type { ReportsOverview } from "./types";
import { getSourceRecordCount } from "./utils";

export function ReportOperationsGrid({
  canExportReports,
  family,
  hasSourceRecords,
  reports,
}: {
  canExportReports: boolean;
  family: FamilyDetail;
  hasSourceRecords: boolean;
  reports: ReportsOverview | null;
}) {
  const t = createTranslator("FamilyReports");
  const totals = reports?.totals;
  const items = [
    {
      title: t("reportPermissionTitle"),
      description: t("reportPermissionDesc"),
      value: hasCapability(family, "VIEW_REPORTS")
        ? t("permissionAllowed")
        : t("permissionViewOnly"),
      icon: ShieldCheckIcon,
    },
    {
      title: t("reportSourceTitle"),
      description: t("reportSourceDesc"),
      value: t("recordsCount", { count: getSourceRecordCount(reports) }),
      icon: CheckCircle2Icon,
    },
    {
      title: t("pendingApprovalsTitle"),
      description: t("pendingApprovalsDesc"),
      value:
        typeof totals?.pendingApprovalCount === "number"
          ? totals.pendingApprovalCount.toLocaleString()
          : t("noQueue"),
      icon: FileClockIcon,
    },
    {
      title: t("exportReadinessTitle"),
      description: t("exportReadinessDesc"),
      value:
        canExportReports && hasSourceRecords ? t("ready") : t("restricted"),
      icon: DownloadIcon,
    },
  ];

  return (
    <section
      aria-label={t("reportOperationsAria")}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => {
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
