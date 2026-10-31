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
import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("FamilyApprovals");
  const tCommon = createTranslator("Common");
  const columns: ColumnDef<ApprovalQueueItem>[] = [
    {
      accessorKey: "type",
      header: t("typeColumn"),
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "title",
      header: t("titleColumn"),
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
      header: t("categoryColumn"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">{t("amountColumn")}</div>,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right font-mono">
          <CompactMoney
            currency={currency}
            emptyLabel={tCommon("notRecorded")}
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
    {
      accessorKey: "requestedBy",
      header: t("requestedBy"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.requestedBy}</span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: t("submittedDate"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.submittedAt)}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: t("priority"),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "status",
      header: t("statusColumn"),
      cell: ({ row }) => <ApprovalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{tCommon("actions")}</div>,
      cell: ({ row }) => {
        const approval = row.original;
        const canUseTransactionAction =
          canApprove &&
          approval.source === "transaction" &&
          approval.status === "PENDING";

        return (
          <div className="flex justify-end gap-1">
            <Button
              aria-label={t("openDetailsAria")}
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
                  aria-label={t("approvalActionsAria")}
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreVerticalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenDetails(approval)}>
                  <FileTextIcon className="mr-2 size-4" />
                  {t("viewDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "approve")}
                >
                  <CheckCircle2Icon className="mr-2 size-4" />
                  {t("approve")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={
                    !canUseTransactionAction || processingId === approval.id
                  }
                  onClick={() => onAction(approval, "reject")}
                >
                  <XCircleIcon className="mr-2 size-4" />
                  {t("reject")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MessageSquareIcon className="mr-2 size-4" />
                  {t("requestChanges")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <UserRoundPlusIcon className="mr-2 size-4" />
                  {t("assignApprover")}
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
        <CardTitle>{t("queueTitle")}</CardTitle>
        <CardDescription>{t("queueDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {approvals.length ? (
          <CommonDataTable columns={columns} data={approvals} pageSize={8} />
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title={t("noPendingApprovals")}
            description={t("noPendingApprovalsDesc")}
          />
        )}
      </CardContent>
    </Card>
  );
}
