import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { DataViewToggle } from "@/components/common/table/data-view-toggle";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersistentViewMode } from "@/hooks/use-persistent-view-mode";
import { hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
import { formatPaymentMethod } from "./expense-utils";
import { FamilyExpenseItems } from "./family-expense-items";
import type { ExpenseTransaction } from "./types-and-schemas";

const FAMILY_EXPENSES_VIEW_MODE_STORAGE_KEY =
  "rwanda-family-family-expenses-view-mode";

export function ExpenseTable({
  filteredTransactions,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
  setOpenCreate,
}: {
  filteredTransactions: ExpenseTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (
    transaction: ExpenseTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (transaction: ExpenseTransaction) => void;
  handleDuplicate: (transaction: ExpenseTransaction) => void;
  handleDownloadReceipt: (transaction: ExpenseTransaction) => void;
  setOpenCreate: (open: boolean) => void;
}) {
  const [viewMode, setViewMode] = usePersistentViewMode(
    FAMILY_EXPENSES_VIEW_MODE_STORAGE_KEY,
  );

  const columns: ColumnDef<ExpenseTransaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Title",
      cell: ({ row }) => (
        <span className="block max-w-[220px] truncate font-medium">
          {row.original.description || "Expense Transaction"}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category.name}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: "Amount",
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
      accessorKey: "receivedFrom",
      header: "Paid To",
      cell: ({ row }) => (
        <span className="block max-w-[160px] truncate">
          {row.original.receivedFrom || "Not recorded"}
        </span>
      ),
    },
    {
      accessorKey: "receivedBy",
      header: "Paid By",
      cell: ({ row }) => (
        <span className="block max-w-[160px] truncate">
          {row.original.receivedBy || "Not recorded"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatPaymentMethod(row.original.paymentMethod)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ExpenseStatusBadge status={row.original.status} />,
    },
    {
      id: "receipt",
      header: "Receipt",
      cell: ({ row }) => {
        const firstReceipt = row.original.receipts?.[0];
        return firstReceipt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadReceipt(row.original)}
            className="max-w-[150px]"
          >
            <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
            <span className="truncate">{firstReceipt.fileName}</span>
          </Button>
        ) : (
          <Badge variant="outline">No receipt</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      cell: ({ row }) => {
        const transaction = row.original;
        const isApproved = transaction.status === "APPROVED";
        const canEdit = !isApproved || isAdmin;
        const firstReceipt = transaction.receipts?.[0];

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="md:min-w-60 min-w-40">
                <DropdownMenuItem
                  onClick={() => handleActionClick(transaction, "view")}
                >
                  <EyeIcon className="mr-2 size-4" />
                  View
                </DropdownMenuItem>
                {canEdit ? (
                  <DropdownMenuItem
                    onClick={() => handleActionClick(transaction, "edit")}
                  >
                    <PencilIcon className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <LockIcon className="mr-2 size-4" />
                    Locked
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleActionClick(transaction, "delete")}
                >
                  <Trash2Icon className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleActionClick(transaction, "receipt")}
                >
                  <UploadIcon className="mr-2 size-4" />
                  Upload Receipt
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!firstReceipt}
                  onClick={() => handleDownloadReceipt(transaction)}
                >
                  <DownloadIcon className="mr-2 size-4" />
                  Download Receipt
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSendApproval(transaction)}
                >
                  {transaction.status === "PENDING" ? (
                    <CheckCircleIcon className="mr-2 size-4" />
                  ) : (
                    <SendIcon className="mr-2 size-4" />
                  )}
                  Send for Approval
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(transaction)}>
                  <CopyIcon className="mr-2 size-4" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div className="space-y-1">
          <CardTitle>Expense History</CardTitle>
          <CardDescription>
            Every recorded family expense with receipts, approvals, and actions.
          </CardDescription>
        </div>
        <DataViewToggle value={viewMode} onValueChange={setViewMode} />
      </CardHeader>
      <CardContent className={cn(viewMode === "items" && "px-0 pb-0")}>
        {filteredTransactions.length ? (
          viewMode === "table" ? (
            <CommonDataTable
              columns={columns}
              data={filteredTransactions}
              getRowAriaLabel={(row) =>
                `View details for ${row.original.description || "Expense Transaction"}`
              }
              onRowClick={(row) => handleActionClick(row.original, "view")}
              rowClassName={() => "hover:bg-muted/50 cursor-pointer"}
            />
          ) : (
            <FamilyExpenseItems
              data={filteredTransactions}
              currency={currency}
              isAdmin={isAdmin}
              handleActionClick={handleActionClick}
              handleSendApproval={handleSendApproval}
              handleDuplicate={handleDuplicate}
              handleDownloadReceipt={handleDownloadReceipt}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <ReceiptTextIcon className="size-6 text-muted-foreground" />
            </span>
            <h3 className="font-semibold text-lg">No expenses recorded yet</h3>
            <p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
              Record your family&apos;s spending to keep track of where money
              goes and improve financial planning.
            </p>
            {hasCapability(family, "RECORD_EXPENSE") ? (
              <Button size="sm" onClick={() => setOpenCreate(true)}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                Add Expense
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseStatusBadge({ status }: { status: string }) {
  const variant =
    status === "APPROVED"
      ? "default"
      : status === "PENDING"
        ? "secondary"
        : status === "REJECTED"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
