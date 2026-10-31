import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, FileClockIcon, Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyApprovalRow, MoneyOverview } from "./types";
import { formatTitle } from "./utils";

export function MoneyApprovalTable({
  currency,
  money,
  familyId,
}: {
  currency: string;
  money: MoneyOverview | null;
  familyId: string;
}) {
  const t = createTranslator("FamilyMoney");
  const tCommon = createTranslator("Common");
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
        toast.success(
          action === "approve"
            ? t((m) => m.FamilyMoney.transactionApproved)
            : t((m) => m.FamilyMoney.transactionRejected),
        );
        window.location.reload();
      } else {
        toast.error(response.message || t((m) => m.FamilyMoney.processFailed));
      }
    } catch {
      toast.error(tCommon("errors.unexpected"));
    } finally {
      setProcessingId(null);
    }
  };

  const columns: ColumnDef<MoneyApprovalRow>[] = [
    {
      accessorKey: "title",
      header: t((m) => m.FamilyMoney.recordColumn),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "type",
      header: t((m) => m.FamilyMoney.typeColumn),
      cell: ({ row }) => formatTitle(row.original.type),
    },
    {
      accessorKey: "submittedBy",
      header: t((m) => m.FamilyMoney.submittedBy),
      cell: ({ row }) =>
        row.original.submittedBy ?? t((m) => m.FamilyMoney.unknownUser),
    },
    {
      accessorKey: "status",
      header: t((m) => m.FamilyMoney.filterStatus),
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "pending"} />
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => (
        <div className="text-right">{t((m) => m.FamilyMoney.amountColumn)}</div>
      ),
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
    {
      id: "actions",
      header: () => (
        <div className="text-right">{tCommon((m) => m.Common.actions)}</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            title={t((m) => m.FamilyApprovals.approve, undefined)}
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
            title={t((m) => m.FamilyApprovals.reject, undefined)}
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
        <CardTitle>{t((m) => m.FamilyMoney.approvalQueueTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyMoney.approvalQueueDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvals.length ? (
          <CommonDataTable columns={columns} data={approvals} />
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title={t((m) => m.FamilyMoney.noApprovalsTitle)}
            description={t((m) => m.FamilyMoney.noApprovalsDesc)}
          />
        )}
      </CardContent>
    </Card>
  );
}
