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
import { CompactMoney } from "@/components/common/money/compact-money";
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
import { createTranslator } from "@/i18n/translate";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
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
  const t = createTranslator("FamilyLoans");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t((m) => m.FamilyLoans.tableTitle)}</CardTitle>
        <CardDescription>{t((m) => m.FamilyLoans.tableDesc)}</CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t((m) => m.FamilyLoans.colDate)}</TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colLoanTitle)}</TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colType)}</TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colBorrower)}</TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colLender)}</TableHead>
                  <TableHead>
                    {t((m) => m.FamilyLoans.colOriginalAmount)}
                  </TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colPaidAmount)}</TableHead>
                  <TableHead>
                    {t((m) => m.FamilyLoans.colRemainingBalance)}
                  </TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colDueDate)}</TableHead>
                  <TableHead>{t((m) => m.FamilyLoans.colStatus)}</TableHead>
                  <TableHead className="text-right">
                    {t((m) => m.FamilyLoans.colActions)}
                  </TableHead>
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
                        <CompactMoney
                          currency={currency}
                          value={loan.originalAmountMinorUnits}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        <CompactMoney
                          currency={currency}
                          value={loan.paidAmountMinorUnits}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono">
                        <CompactMoney
                          currency={currency}
                          value={loan.remainingBalanceMinorUnits}
                        />
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
                              aria-label={t(
                                (m) => m.FamilyLoans.openActionsAria,
                                {
                                  title: loan.title,
                                },
                              )}
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
                              {t((m) => m.FamilyLoans.viewAction)}
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
                              {t((m) => m.FamilyLoans.editAction)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "repayment")}
                            >
                              <PlusIcon className="mr-2 size-4" />
                              {t((m) => m.FamilyLoans.addRepaymentAction)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAction(loan, "history")}
                            >
                              <HistoryIcon className="mr-2 size-4" />
                              {t((m) => m.FamilyLoans.historyAction)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canManageLoans}
                              onClick={() => onAction(loan, "document")}
                            >
                              <UploadIcon className="mr-2 size-4" />
                              {t((m) => m.FamilyLoans.documentAction)}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "approval")}
                            >
                              <SendIcon className="mr-2 size-4" />
                              {t((m) => m.FamilyLoans.approvalAction)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "complete")}
                            >
                              <CheckCircle2Icon className="mr-2 size-4" />
                              {t((m) => m.FamilyLoans.completeAction)}
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
                              {t((m) => m.FamilyLoans.deleteAction)}
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
              <EmptyTitle>{t((m) => m.FamilyLoans.noLoansTitle)}</EmptyTitle>
              <EmptyDescription>
                {t((m) => m.FamilyLoans.noLoansDesc)}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canManageLoans ? (
                <Button size="sm" onClick={onAddLoan}>
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  {t((m) => m.FamilyLoans.createTitle)}
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t((m) => m.FamilyLoans.viewLoansForFamily, {
                    family: family.name,
                  })}
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
