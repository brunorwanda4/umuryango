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
      header: t((m) => m.FamilyReports.exportTitle),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "format",
      header: t((m) => m.FamilyReports.formatTitle),
      cell: ({ row }) => formatTitle(row.original.format),
    },
    {
      accessorKey: "requestedBy",
      header: t((m) => m.FamilyReports.requestedByTitle),
      cell: ({ row }) =>
        row.original.requestedBy ?? t((m) => m.FamilyReports.unknownUser),
    },
    {
      accessorKey: "requestedAt",
      header: t((m) => m.FamilyReports.requestedAtTitle),
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    {
      accessorKey: "status",
      header: t((m) => m.FamilyReports.statusColumn),
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
            title={t((m) => m.FamilyReports.newExportDisabledTitle)}
          >
            <DownloadIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyReports.newExport)}
          </Button>
        </CardAction>
        <CardTitle>{t((m) => m.FamilyReports.reportExportsTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyReports.reportExportsDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exports.length ? (
          <CommonDataTable columns={columns} data={exports} />
        ) : (
          <TableEmptyState
            description={t((m) => m.FamilyReports.noExportsDesc)}
            icon={FileSpreadsheetIcon}
            title={t((m) => m.FamilyReports.noExportsTitle)}
          />
        )}
      </CardContent>
    </Card>
  );
}
