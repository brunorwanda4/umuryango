import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  EyeIcon,
  FileClockIcon,
  FileTextIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  UserRoundPlusIcon,
  XCircleIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableEmptyState } from "../money-ui-helpers";
import { formatDate } from "../utils";
import {
  ApprovalStatusBadge,
  PriorityBadge,
  TypeBadge,
} from "./approval-badges";
import type { ApprovalQueueItem } from "./types";

export function ApprovalQueue({
  approvals,
  canApprove,
  currency,
  onAction,
  onOpenDetails,
  processingId,
}: {
  approvals: ApprovalQueueItem[];
  canApprove: boolean;
  currency: string;
  onAction: (approval: ApprovalQueueItem, action: "approve" | "reject") => void;
  onOpenDetails: (approval: ApprovalQueueItem) => void;
  processingId: string | null;
}) {
  const columns: ColumnDef<ApprovalQueueItem>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <button
          className="block max-w-[220px] truncate text-left font-medium hover:underline"
          type="button"
          onClick={() => onOpenDetails(row.original)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right font-mono">
          <CompactMoney
            currency={currency}
            emptyLabel="Not recorded"
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
    {
      accessorKey: "requestedBy",
      header: "Requested By",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.requestedBy}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.submittedAt)}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ApprovalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const approval = row.original;
        const canUseTransactionAction =
          canApprove &&
          approval.source === "transaction" &&
          approval.status === "PENDING";

        return (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Open approval details"
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={() => onOpenDetails(approval)}
            >
              <EyeIcon aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Approval actions"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreVerticalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenDetails(approval)}>
                  <FileTextIcon className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "approve")}
                >
                  <CheckCircle2Icon className="mr-2 size-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "reject")}
                >
                  <XCircleIcon className="mr-2 size-4" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MessageSquareIcon className="mr-2 size-4" />
                  Request Changes
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <UserRoundPlusIcon className="mr-2 size-4" />
                  Assign Approver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Approval Queue</CardTitle>
        <CardDescription>
          Pending income, expenses, budget requests, large transactions, and
          other financial records that require review.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {approvals.length ? (
          <CommonDataTable columns={columns} data={approvals} pageSize={8} />
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title="No pending approvals"
            description="All financial transactions have been reviewed. New income, expenses, or budget requests requiring approval will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
