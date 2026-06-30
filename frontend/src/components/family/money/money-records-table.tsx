import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptTextIcon } from "lucide-react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview, MoneyRecordRow } from "./types";
import { formatDate, formatOptionalMoney, formatTitle } from "./utils";

export function MoneyRecordsTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = money?.records ?? [];
  const columns: ColumnDef<MoneyRecordRow>[] = [
    {
      accessorKey: "title",
      header: "Record",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            {formatTitle(row.original.type)} by{" "}
            {row.original.createdBy ?? "Unknown"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category ?? "Uncategorized",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status ?? "draft"} />,
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.amountMinorUnits, currency)}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent records</CardTitle>
        <CardDescription>
          The latest persisted money records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <CommonDataTable columns={columns} data={records} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title="No recent records returned"
            description="Income, expenses, contribution payments, savings movements, and debt repayments will show here."
          />
        )}
      </CardContent>
    </Card>
  );
}
