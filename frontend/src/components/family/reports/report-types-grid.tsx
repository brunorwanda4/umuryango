import { DownloadIcon, EyeIcon } from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { ReportFact } from "./reports-ui-helpers";
import type { ReportsOverview } from "./types";
import {
  findRecentReport,
  formatDateTime,
  formatTitle,
  reportTypes,
} from "./utils";

export function ReportTypesGrid({
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
  const tCommon = createTranslator("Common");

  return (
    <section
      aria-label={t((m) => m.FamilyReports.availableReportTypesAria)}
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"
    >
      {reportTypes.map((reportType) => {
        const Icon = reportType.icon;
        const recentReport = findRecentReport(reports, reportType.type);
        const title = t(`cards.${reportType.type}.title`);
        const description = t(`cards.${reportType.type}.description`);

        return (
          <Card key={reportType.type}>
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReportFact
                  label={t((m) => m.FamilyReports.statusColumn)}
                  value={
                    recentReport?.status
                      ? formatTitle(recentReport.status)
                      : t("statusNotGenerated")
                  }
                />
                <ReportFact
                  label={t((m) => m.FamilyReports.lastGenerated)}
                  value={formatDateTime(recentReport?.generatedAt)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {reportType.hrefSegment ? (
                  <Button
                    href={`/family/${encodeURIComponent(family.slug)}/${reportType.hrefSegment}`}
                    size="sm"
                    variant="outline"
                  >
                    <EyeIcon aria-hidden="true" data-icon="inline-start" />
                    {t((m) => m.FamilyReports.viewSource)}
                  </Button>
                ) : null}
                <Button
                  disabled={!canExportReports || !hasSourceRecords}
                  size="sm"
                  title={t((m) => m.FamilyReports.reportExportWorkflowTitle)}
                >
                  <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                  {tCommon((m) => m.Common.export)}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
