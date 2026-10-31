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
      title: t((m) => m.FamilyReports.reportPermissionTitle),
      description: t((m) => m.FamilyReports.reportPermissionDesc),
      value: hasCapability(family, "VIEW_REPORTS")
        ? t((m) => m.FamilyReports.permissionAllowed)
        : t((m) => m.FamilyReports.permissionViewOnly),
      icon: ShieldCheckIcon,
    },
    {
      title: t((m) => m.FamilyReports.reportSourceTitle),
      description: t((m) => m.FamilyReports.reportSourceDesc),
      value: t((m) => m.FamilyReports.recordsCount, {
        count: getSourceRecordCount(reports),
      }),
      icon: CheckCircle2Icon,
    },
    {
      title: t((m) => m.FamilyReports.pendingApprovalsTitle),
      description: t((m) => m.FamilyReports.pendingApprovalsDesc),
      value:
        typeof totals?.pendingApprovalCount === "number"
          ? totals.pendingApprovalCount.toLocaleString()
          : t((m) => m.FamilyReports.noQueue),
      icon: FileClockIcon,
    },
    {
      title: t((m) => m.FamilyReports.exportReadinessTitle),
      description: t((m) => m.FamilyReports.exportReadinessDesc),
      value:
        canExportReports && hasSourceRecords
          ? t((m) => m.FamilyReports.ready)
          : t((m) => m.FamilyReports.restricted),
      icon: DownloadIcon,
    },
  ];

  return (
    <section
      aria-label={t((m) => m.FamilyReports.reportOperationsAria)}
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
