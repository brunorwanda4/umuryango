import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, FileClockIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import apiRequest from "@/service/api";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyApprovalRow, MoneyOverview } from "./types";
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
        `/families/${encodeURIComponent(familyId)}/money/transactions/${id}/${action}`,
      );
      if (response.ok) {
        toast.success(`Transaction ${action}d successfully`);
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to process transaction");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const columns: ColumnDef<MoneyApprovalRow>[] = [
    {
      accessorKey: "title",
      header: "Record",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => formatTitle(row.original.type),
    },
    {
      accessorKey: "submittedBy",
      header: "Submitted by",
      cell: ({ row }) => row.original.submittedBy ?? "Unknown",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "pending"} />
      ),
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
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            title="Approve"
            disabled={processingId === row.original.id}
            onClick={() => handleAction(row.original.id, "approve")}
          >
            {processingId === row.original.id ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <CheckIcon className="text-green-600" />
            )}
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            title="Reject"
            disabled={processingId === row.original.id}
            onClick={() => handleAction(row.original.id, "reject")}
          >
            {processingId === row.original.id ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <XIcon className="text-destructive" />
            )}
          </Button>
        </div>
      ),
    },
  ];

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
          <CommonDataTable columns={columns} data={approvals} />
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
