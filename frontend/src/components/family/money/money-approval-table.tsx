import { FileClockIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import apiRequest from "@/service/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  familyId,
}: {
  currency: string;
  money: MoneyOverview | null;
  familyId: string;
}) {
  const approvals = money?.approvals ?? [];
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const response = await apiRequest(
        "patch",
        `/families/${encodeURIComponent(familyId)}/money/transactions/${id}/${action}`
      );
      if (response.ok) {
        toast.success(`Transaction ${action}d successfully`);
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to process transaction");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Approve"
                        disabled={processingId === row.id}
                        onClick={() => handleAction(row.id, "approve")}
                      >
                        {processingId === row.id ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <CheckIcon className="text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Reject"
                        disabled={processingId === row.id}
                        onClick={() => handleAction(row.id, "reject")}
                      >
                        {processingId === row.id ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <XIcon className="text-destructive" />
                        )}
                      </Button>
                    </div>
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
