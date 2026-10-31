import { FileSpreadsheetIcon, PrinterIcon } from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";

export function ReportsHeader({
  canExportReports,
  currency,
  family,
  hasSourceRecords,
}: {
  canExportReports: boolean;
  currency: string;
  family: FamilyDetail;
  hasSourceRecords: boolean;
}) {
  const t = createTranslator("FamilyReports");

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              {t("title")}
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords
                ? t("sourceRecordsLoaded")
                : t("noSourceRecords")}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            {t("reportsHeaderDesc", { name: family.name })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canExportReports ? (
            <>
              <Button disabled size="sm" title={t("pdfNeedsExportJob")}>
                <PrinterIcon aria-hidden="true" data-icon="inline-start" />
                {t("exportPdf")}
              </Button>
              <Button
                disabled
                size="sm"
                title={t("excelNeedsExportJob")}
                variant="outline"
              >
                <FileSpreadsheetIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                {t("exportExcel")}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.name}</Badge>
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{currency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}
