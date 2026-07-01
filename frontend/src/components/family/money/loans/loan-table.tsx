"use client";

import {
  CheckCircle2Icon,
  EyeIcon,
  FileClockIcon,
  HistoryIcon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import { LoanStatusBadge } from "./loan-status-badge";
import { getLoanProgress, isLoanOverdue, loanTypeLabel } from "./loan-utils";
import type { LoanRecord } from "./types-and-schemas";

type LoanAction =
  | "view"
  | "edit"
  | "repayment"
  | "history"
  | "document"
  | "approval"
  | "complete"
  | "delete";

export function LoanTable({
  canManageLoans,
  currency,
  family,
  loans,
  onAction,
  onAddLoan,
}: {
  canManageLoans: boolean;
  currency: string;
  family: FamilyDetail;
  loans: LoanRecord[];
  onAction: (loan: LoanRecord, action: LoanAction) => void;
  onAddLoan: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Table and History</CardTitle>
        <CardDescription>
          Borrowed money, lent money, repayment balances, due dates, approvals,
          and loan actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Loan Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const overdue = isLoanOverdue(loan);
                  const completed = loan.status === "COMPLETED";

                  return (
                    <TableRow
                      key={loan.id}
                      className={overdue ? "bg-destructive/5" : undefined}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(loan.startDate)}
                      </TableCell>
                      <TableCell className="min-w-56">
                        <div className="flex flex-col gap-2">
                          <span className="font-medium">{loan.title}</span>
                          <Progress value={getLoanProgress(loan)} />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {loanTypeLabel(loan.type)}
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {loan.borrower}
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {loan.lender}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        {formatMinorUnits(
                          loan.originalAmountMinorUnits,
                          currency,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        {formatMinorUnits(loan.paidAmountMinorUnits, currency)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        {formatMinorUnits(
                          loan.remainingBalanceMinorUnits,
                          currency,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={
                            overdue ? "font-medium text-destructive" : undefined
                          }
                        >
                          {formatDate(loan.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <LoanStatusBadge loan={loan} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label={`Open actions for ${loan.title}`}
                              variant="ghost"
                              size="icon"
                            >
                              <MoreVerticalIcon aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onAction(loan, "view")}
                            >
                              <EyeIcon className="mr-2 size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "edit")}
                            >
                              {completed ? (
                                <LockIcon className="mr-2 size-4" />
                              ) : (
                                <PencilIcon className="mr-2 size-4" />
                              )}
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "repayment")}
                            >
                              <PlusIcon className="mr-2 size-4" />
                              Add Repayment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAction(loan, "history")}
                            >
                              <HistoryIcon className="mr-2 size-4" />
                              View Repayment History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canManageLoans}
                              onClick={() => onAction(loan, "document")}
                            >
                              <UploadIcon className="mr-2 size-4" />
                              Attach Document
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "approval")}
                            >
                              <SendIcon className="mr-2 size-4" />
                              Send for Approval
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "complete")}
                            >
                              <CheckCircle2Icon className="mr-2 size-4" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !canManageLoans ||
                                !(
                                  loan.status === "DRAFT" ||
                                  loan.status === "CANCELLED"
                                )
                              }
                              variant="destructive"
                              onClick={() => onAction(loan, "delete")}
                            >
                              <Trash2Icon className="mr-2 size-4" />
                              Delete if allowed
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
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileClockIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No loans recorded yet</EmptyTitle>
              <EmptyDescription>
                Track money borrowed, money lent, repayments, and due dates so
                the family always knows what is owed and what has been paid.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canManageLoans ? (
                <Button size="sm" onClick={onAddLoan}>
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  Add Loan
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">
                  You can view loan records for {family.name} when they are
                  available.
                </span>
              )}
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

export type { LoanAction };
