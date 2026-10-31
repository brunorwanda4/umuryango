import type { ColumnDef } from "@tanstack/react-table";
import { CoinsIcon, PlusIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { DataViewToggle } from "@/components/common/table/data-view-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersistentViewMode } from "@/hooks/use-persistent-view-mode";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
import { FamilyIncomeItems } from "./family-income-items";
import {
  type IncomeAction,
  IncomeActionsDropdown,
} from "./income-actions-dropdown";
import type { IncomeTransaction } from "./types-and-schemas";

const FAMILY_INCOME_VIEW_MODE_STORAGE_KEY =
  "rwanda-family-family-income-view-mode";

function getRemainingMinorUnits(tx: IncomeTransaction) {
  if (!tx.expectedAmountMinorUnits) return null;

  const expected = BigInt(tx.expectedAmountMinorUnits);
  const paid = BigInt(tx.amountMinorUnits);
  const remaining = expected - paid;

  return remaining > BigInt(0) ? remaining.toString() : "0";
}

function formatPaymentStatus(status: IncomeTransaction["paymentStatus"]) {
  return status.replace("_", " ");
}

export function IncomeTable({
  filteredTransactions,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
  setOpenCreate,
}: {
  filteredTransactions: IncomeTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (tx: IncomeTransaction, action: IncomeAction) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
  setOpenCreate: (open: boolean) => void;
}) {
  const t = createTranslator("FamilyIncome");
  const _tCommon = createTranslator("Common");
  const [viewMode, setViewMode] = usePersistentViewMode(
    FAMILY_INCOME_VIEW_MODE_STORAGE_KEY,
  );

  const columns: ColumnDef<IncomeTransaction>[] = [
    {
      accessorKey: "date",
      header: t((m) => m.FamilyIncome.table.columnDate),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: t((m) => m.FamilyIncome.table.columnTitle),
      cell: ({ row }) => (
        <span className="block max-w-[180px] truncate font-medium">
          {row.original.description ||
            t((m) => m.FamilyIncome.table.columnTitle)}
        </span>
      ),
    },
    {
      accessorKey: "category.name",
      header: t((m) => m.FamilyIncome.table.columnCategory),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category.name}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: t((m) => m.FamilyIncome.table.columnAmount),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono">
          <CompactMoney
            currency={currency}
            value={row.original.amountMinorUnits}
          />
        </span>
      ),
    },
    {
      id: "remaining",
      header: "Left",
      cell: ({ row }) => {
        const remaining = getRemainingMinorUnits(row.original);

        return (
          <span className="whitespace-nowrap font-mono">
            {remaining === null ? (
              "-"
            ) : (
              <CompactMoney currency={currency} value={remaining} />
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "receivedFrom",
      header: t((m) => m.FamilyIncome.table.columnReceivedFrom),
      cell: ({ row }) => (
        <span className="block max-w-[150px] truncate">
          {row.original.receivedFrom || "-"}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.dueDate ? formatDate(row.original.dueDate) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: t((m) => m.FamilyIncome.table.columnPaymentMethod),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.paymentMethod
            ? row.original.paymentMethod.replace("_", " ")
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus;

        return row.original.incomeRecurrence === "MONTHLY" ? (
          <Badge
            variant={
              status === "PAID"
                ? "default"
                : status === "PARTIAL" || status === "UNPAID"
                  ? "secondary"
                  : "outline"
            }
          >
            {formatPaymentStatus(status)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: t((m) => m.FamilyIncome.table.columnStatus),
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <Badge
            variant={
              status === "APPROVED"
                ? "default"
                : status === "PENDING"
                  ? "secondary"
                  : status === "REJECTED"
                    ? "destructive"
                    : "outline"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy.fullName",
      header: "Added By",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.createdBy.fullName}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right">
          {t((m) => m.FamilyIncome.table.columnActions)}
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <IncomeActionsDropdown
            tx={row.original}
            family={family}
            isAdmin={isAdmin}
            handleActionClick={handleActionClick}
            handleSendApproval={handleSendApproval}
          />
        </div>
      ),
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle>{t((m) => m.FamilyIncome.table.historyTitle)}</CardTitle>
        <DataViewToggle value={viewMode} onValueChange={setViewMode} />
      </CardHeader>
      <CardContent
        className={cn("min-w-0", viewMode === "items" && "px-0 pb-0")}
      >
        {filteredTransactions.length > 0 ? (
          viewMode === "table" ? (
            <CommonDataTable
              columns={columns}
              data={filteredTransactions}
              getRowAriaLabel={(row) =>
                t((m) => m.FamilyIncome.table.viewDetailsAria, {
                  title: row.original.description || "Income Transaction",
                })
              }
              onRowClick={(row) => handleActionClick(row.original, "view")}
              rowClassName={() => "hover:bg-muted/50 cursor-pointer"}
            />
          ) : (
            <FamilyIncomeItems
              data={filteredTransactions}
              currency={currency}
              isAdmin={isAdmin}
              family={family}
              handleActionClick={handleActionClick}
              handleSendApproval={handleSendApproval}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
              <CoinsIcon className="size-6 text-muted-foreground" />
            </span>
            <h3 className="font-semibold text-lg">
              {t((m) => m.FamilyIncome.table.emptyTitle)}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
              {t((m) => m.FamilyIncome.table.emptyDesc)}
            </p>
            {hasCapability(family, "RECORD_INCOME") && (
              <Button size="sm" onClick={() => setOpenCreate(true)}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                {t((m) => m.FamilyIncome.addIncome)}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
