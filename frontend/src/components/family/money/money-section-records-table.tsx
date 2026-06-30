import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./money-ui-helpers";
import type { MoneyRecordRow } from "./types";
import { formatDate, formatOptionalMoney, formatTitle } from "./utils";

export function MoneySectionRecordsTable({
  currency,
  records,
}: {
  currency: string;
  records: MoneyRecordRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Record</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{row.title}</span>
                <span className="text-muted-foreground text-xs">
                  {formatTitle(row.type)} by {row.createdBy ?? "Unknown"}
                </span>
              </div>
            </TableCell>
            <TableCell>{row.category ?? "Uncategorized"}</TableCell>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell>
              <StatusBadge value={row.status ?? "draft"} />
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatOptionalMoney(row.amountMinorUnits, currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
