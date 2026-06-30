import { FileClockIcon } from "lucide-react";
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
import { formatOptionalMoney, formatTitle } from "./utils";

export function MoneyApprovalTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const approvals = money?.approvals ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval queue</CardTitle>
        <CardDescription>
          Reviewable money records returned by the family API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvals.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{formatTitle(row.type)}</TableCell>
                  <TableCell>{row.submittedBy ?? "Unknown"}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status ?? "pending"} />
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
            icon={FileClockIcon}
            title="No approvals returned"
            description="Submitted income, expense, debt, and contribution records that need approval will show here."
          />
        )}
      </CardContent>
    </Card>
  );
}
