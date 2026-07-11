import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptTextIcon } from "lucide-react";
import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, TableEmptyState } from "./reports-ui-helpers";
import type {
  MoneyOverview,
  ReportSourceRecordRow,
  ReportsOverview,
} from "./types";
import { formatDate, formatTitle, getSourceRecords } from "./utils";

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
  const columns: ColumnDef<ReportSourceRecordRow>[] = [
    {
      accessorKey: "title",
      header: "Record",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            Created by {row.original.createdBy ?? "Unknown"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ row }) => formatTitle(row.original.module),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "recorded"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          <CompactMoney
            currency={currency}
            emptyLabel="No records"
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
  ];

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
          <CommonDataTable columns={columns} data={records} />
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
