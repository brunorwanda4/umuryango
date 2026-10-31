import type { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
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
import { StatusBadge, TableEmptyState } from "./reports-ui-helpers";
import type { ReportExportRow, ReportsOverview } from "./types";
import { formatDateTime, formatTitle } from "./utils";

export function ExportsTable({
  canExportReports,
  hasSourceRecords,
  reports,
}: {
  canExportReports: boolean;
  hasSourceRecords: boolean;
  reports: ReportsOverview | null;
}) {
  const t = createTranslator("FamilyReports");
  const exports = reports?.exports ?? [];
  const columns: ColumnDef<ReportExportRow>[] = [
    {
      accessorKey: "title",
      header: t("exportTitle"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "format",
      header: t("formatTitle"),
      cell: ({ row }) => formatTitle(row.original.format),
    },
    {
      accessorKey: "requestedBy",
      header: t("requestedByTitle"),
      cell: ({ row }) => row.original.requestedBy ?? t("unknownUser"),
    },
    {
      accessorKey: "requestedAt",
      header: t("requestedAtTitle"),
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    {
      accessorKey: "status",
      header: t("statusColumn"),
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "queued"} />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Button
            disabled={!canExportReports || !hasSourceRecords}
            size="sm"
            title={t("newExportDisabledTitle")}
          >
            <DownloadIcon aria-hidden="true" data-icon="inline-start" />
            {t("newExport")}
          </Button>
        </CardAction>
        <CardTitle>{t("reportExportsTitle")}</CardTitle>
        <CardDescription>{t("reportExportsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {exports.length ? (
          <CommonDataTable columns={columns} data={exports} />
        ) : (
          <TableEmptyState
            description={t("noExportsDesc")}
            icon={FileSpreadsheetIcon}
            title={t("noExportsTitle")}
          />
        )}
      </CardContent>
    </Card>
  );
}
