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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import { formatPaymentMethod } from "./expense-utils";
import type { ExpenseTransaction } from "./types-and-schemas";

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
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Expense History</CardTitle>
        <CardDescription>
          Every recorded family expense with receipts, approvals, and actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid To</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const isApproved = transaction.status === "APPROVED";
                  const canEdit = !isApproved || isAdmin;
                  const firstReceipt = transaction.receipts?.[0];

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {transaction.description || "Expense Transaction"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {transaction.category.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        {formatMinorUnits(
                          transaction.amountMinorUnits,
                          currency,
                        )}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {transaction.receivedFrom || "Not recorded"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {transaction.receivedBy || "Not recorded"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPaymentMethod(transaction.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <ExpenseStatusBadge status={transaction.status} />
                      </TableCell>
                      <TableCell>
                        {firstReceipt ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(transaction)}
                            className="max-w-[150px]"
                          >
                            <ReceiptTextIcon
                              aria-hidden="true"
                              data-icon="inline-start"
                            />
                            <span className="truncate">
                              {firstReceipt.fileName}
                            </span>
                          </Button>
                        ) : (
                          <Badge variant="outline">No receipt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVerticalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleActionClick(transaction, "view")
                              }
                            >
                              <EyeIcon className="mr-2 size-4" />
                              View
                            </DropdownMenuItem>
                            {canEdit ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleActionClick(transaction, "edit")
                                }
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
                              onClick={() =>
                                handleActionClick(transaction, "delete")
                              }
                            >
                              <Trash2Icon className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleActionClick(transaction, "receipt")
                              }
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
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(transaction)}
                            >
                              <CopyIcon className="mr-2 size-4" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
