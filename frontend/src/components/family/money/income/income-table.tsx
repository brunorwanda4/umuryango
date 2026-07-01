import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  CoinsIcon,
  EyeIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

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
  handleActionClick: (
    tx: IncomeTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
  setOpenCreate: (open: boolean) => void;
}) {
  const columns: ColumnDef<IncomeTransaction>[] = [
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
        <span className="block max-w-[180px] truncate font-medium">
          {row.original.description || "Income Transaction"}
        </span>
      ),
    },
    {
      accessorKey: "category.name",
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
          {formatMinorUnits(row.original.amountMinorUnits, currency)}
        </span>
      ),
    },
    {
      accessorKey: "receivedFrom",
      header: "Received From",
      cell: ({ row }) => (
        <span className="block max-w-[150px] truncate">
          {row.original.receivedFrom || "—"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.paymentMethod
            ? row.original.paymentMethod.replace("_", " ")
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const tx = row.original;
        const txIsApproved = tx.status === "APPROVED";
        const canEditThisTx = !txIsApproved || isAdmin;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleActionClick(tx, "view")}>
                  <EyeIcon className="size-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                {canEditThisTx ? (
                  <DropdownMenuItem
                    onClick={() => handleActionClick(tx, "edit")}
                  >
                    <PencilIcon className="size-4 mr-2" />
                    Edit Record
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <LockIcon className="size-4 mr-2" />
                    Locked (Approved)
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => handleActionClick(tx, "receipt")}
                >
                  <UploadIcon className="size-4 mr-2" />
                  Attach Receipt
                </DropdownMenuItem>

                {tx.status === "PENDING" &&
                  hasCapability(family, "APPROVE_EXPENSE") && (
                    <DropdownMenuItem
                      onClick={() => handleSendApproval(tx)}
                      className="text-primary font-medium"
                    >
                      <CheckCircleIcon className="size-4 mr-2" />
                      Approve Income
                    </DropdownMenuItem>
                  )}

                <DropdownMenuItem
                  onClick={() => handleActionClick(tx, "delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon className="size-4 mr-2" />
                  Delete
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
      <CardHeader className="pb-3">
        <CardTitle>Income History</CardTitle>
        <CardDescription>
          List of all incoming money recorded for this family.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {filteredTransactions.length > 0 ? (
          <CommonDataTable columns={columns} data={filteredTransactions} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
              <CoinsIcon className="size-6 text-muted-foreground" />
            </span>
            <h3 className="font-semibold text-lg">No income recorded yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
              Start by adding salary, business income, family contributions,
              gifts, donations, or other money received by the family.
            </p>
            {hasCapability(family, "RECORD_INCOME") && (
              <Button size="sm" onClick={() => setOpenCreate(true)}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                Add Income
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
