import { ReceiptTextIcon } from "lucide-react";
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
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { formatDate, formatOptionalMoney, formatTitle } from "./utils";

export function MoneyRecordsTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = money?.records ?? [];

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
