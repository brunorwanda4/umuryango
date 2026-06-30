import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, TableEmptyState } from "./reports-ui-helpers";
import type { ReportsOverview } from "./types";
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Export</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exportRow) => (
                <TableRow key={exportRow.id}>
                  <TableCell className="font-medium">
                    {exportRow.title}
                  </TableCell>
                  <TableCell>{formatTitle(exportRow.format)}</TableCell>
                  <TableCell>{exportRow.requestedBy ?? "Unknown"}</TableCell>
                  <TableCell>{formatDateTime(exportRow.requestedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge value={exportRow.status ?? "queued"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
