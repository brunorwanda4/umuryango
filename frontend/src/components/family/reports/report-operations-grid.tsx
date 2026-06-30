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
  const totals = reports?.totals;
  const items = [
    {
      title: "Report permission",
      description: "Backend must authorize every protected report action.",
      value: hasCapability(family, "VIEW_REPORTS") ? "Allowed" : "View only",
      icon: ShieldCheckIcon,
    },
    {
      title: "Report source",
      description: "Generated from persisted family records only.",
      value: `${getSourceRecordCount(reports).toLocaleString()} records`,
      icon: CheckCircle2Icon,
    },
    {
      title: "Pending approvals",
      description: "Draft or rejected financial records stay out of reports.",
      value:
        typeof totals?.pendingApprovalCount === "number"
          ? totals.pendingApprovalCount.toLocaleString()
          : "No queue",
      icon: FileClockIcon,
    },
    {
      title: "Export readiness",
      description: "PDF and Excel exports need permission and source records.",
      value: canExportReports && hasSourceRecords ? "Ready" : "Restricted",
      icon: DownloadIcon,
    },
  ];

  return (
    <section
      aria-label="Report operations"
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
