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
        <CardTitle>{t("tableTitle")}</CardTitle>
        <CardDescription>{t("tableDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colLoanTitle")}</TableHead>
                  <TableHead>{t("colType")}</TableHead>
                  <TableHead>{t("colBorrower")}</TableHead>
                  <TableHead>{t("colLender")}</TableHead>
                  <TableHead>{t("colOriginalAmount")}</TableHead>
                  <TableHead>{t("colPaidAmount")}</TableHead>
                  <TableHead>{t("colRemainingBalance")}</TableHead>
                  <TableHead>{t("colDueDate")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead className="text-right">
                    {t("colActions")}
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
                              aria-label={t("openActionsAria", {
                                title: loan.title,
                              })}
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
                              {t("viewAction")}
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
                              {t("editAction")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "repayment")}
                            >
                              <PlusIcon className="mr-2 size-4" />
                              {t("addRepaymentAction")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAction(loan, "history")}
                            >
                              <HistoryIcon className="mr-2 size-4" />
                              {t("historyAction")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canManageLoans}
                              onClick={() => onAction(loan, "document")}
                            >
                              <UploadIcon className="mr-2 size-4" />
                              {t("documentAction")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "approval")}
                            >
                              <SendIcon className="mr-2 size-4" />
                              {t("approvalAction")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={completed || !canManageLoans}
                              onClick={() => onAction(loan, "complete")}
                            >
                              <CheckCircle2Icon className="mr-2 size-4" />
                              {t("completeAction")}
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
                              {t("deleteAction")}
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
              <EmptyTitle>{t("noLoansTitle")}</EmptyTitle>
              <EmptyDescription>{t("noLoansDesc")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canManageLoans ? (
                <Button size="sm" onClick={onAddLoan}>
                  <PlusIcon aria-hidden="true" data-icon="inline-start" />
                  {t("createTitle")}
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t("viewLoansForFamily", { family: family.name })}
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
