import type { ColumnDef } from "@tanstack/react-table";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { StatusBadge } from "./money-ui-helpers";
import type { MoneyRecordRow } from "./types";
import { formatDate, formatTitle } from "./utils";

export function MoneySectionRecordsTable({
  currency,
  records,
}: {
  currency: string;
  records: MoneyRecordRow[];
}) {
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
          <CompactMoney
            currency={currency}
            emptyLabel="No records"
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
  ];

  return <CommonDataTable columns={columns} data={records} />;
}
