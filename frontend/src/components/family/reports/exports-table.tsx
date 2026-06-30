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
  const exports = reports?.exports ?? [];
  const columns: ColumnDef<ReportExportRow>[] = [
    {
      accessorKey: "title",
      header: "Export",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => formatTitle(row.original.format),
    },
    {
      accessorKey: "requestedBy",
      header: "Requested by",
      cell: ({ row }) => row.original.requestedBy ?? "Unknown",
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    {
      accessorKey: "status",
      header: "Status",
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
            title="Exports require backend jobs and report export permission."
          >
            <DownloadIcon aria-hidden="true" data-icon="inline-start" />
            New export
          </Button>
        </CardAction>
        <CardTitle>Report exports</CardTitle>
        <CardDescription>
          PDF, Excel, and print jobs requested for this family.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exports.length ? (
          <CommonDataTable columns={columns} data={exports} />
        ) : (
          <TableEmptyState
            description="Generated PDF and Excel export jobs will appear here after the backend report workflow saves them."
            icon={FileSpreadsheetIcon}
            title="No report exports returned"
          />
        )}
      </CardContent>
    </Card>
  );
}
