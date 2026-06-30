import { ReceiptTextIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Card,
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
import type { MoneyOverview, ReportsOverview } from "./types";
import {
  formatDate,
  formatOptionalMoney,
  formatTitle,
  getSourceRecords,
} from "./utils";

export function SourceRecordsTable({
  currency,
  money,
  reports,
}: {
  currency: string;
  money: MoneyOverview | null;
  reports: ReportsOverview | null;
}) {
  const records = useMemo(
    () => getSourceRecords(reports, money),
    [reports, money],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source records</CardTitle>
        <CardDescription>
          Persisted records used by report previews and generated files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={`${record.module}-${record.id}`}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{record.title}</span>
                      <span className="text-muted-foreground text-xs">
                        Created by {record.createdBy ?? "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatTitle(record.module)}</TableCell>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <StatusBadge value={record.status ?? "recorded"} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(record.amountMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            description="Income, expenses, contribution payments, savings movements, debts, budgets, projects, and generated report inputs will appear here."
            icon={ReceiptTextIcon}
            title="No source records returned"
          />
        )}
      </CardContent>
    </Card>
  );
}
