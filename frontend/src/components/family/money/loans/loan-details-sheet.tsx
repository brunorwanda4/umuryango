"use client";

import {
  type CalendarClockIcon,
  FileTextIcon,
  HistoryIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTranslator } from "@/i18n/translate";
import { formatDate } from "../utils";
import { ApprovalStatusBadge, LoanStatusBadge } from "./loan-status-badge";
import {
  formatInterestRate,
  formatPaymentMethod,
  getLoanProgress,
  loanTypeLabel,
  repaymentFrequencyLabel,
} from "./loan-utils";
import type { LoanRecord } from "./types-and-schemas";

export function LoanDetailsSheet({
  currency,
  loan,
  onOpenChange,
}: {
  currency: string;
  loan: LoanRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = createTranslator("FamilyLoans");

  return (
    <Sheet open={Boolean(loan)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{loan?.title ?? t("dialogs.detailsTitle")}</SheetTitle>
          <SheetDescription>{t("dialogs.detailsDesc")}</SheetDescription>
        </SheetHeader>
        {loan ? (
          <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <LoanStatusBadge loan={loan} />
                <ApprovalStatusBadge status={loan.approvalStatus} />
                <Badge variant="outline">{loanTypeLabel(loan.type)}</Badge>
              </div>
              <div className="rounded-md border p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground text-sm">
                    {t("details.repaymentProgress")}
                  </span>
                  <span className="font-medium text-sm">
                    {getLoanProgress(loan)}%
                  </span>
                </div>
                <Progress value={getLoanProgress(loan)} />
              </div>
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label={t("details.originalAmount")}
                  value={
                    <CompactMoney
                      currency={currency}
                      value={loan.originalAmountMinorUnits}
                    />
                  }
                />
                <DetailItem
                  label={t("details.totalExpectedPayment")}
                  value={
                    <CompactMoney
                      currency={currency}
                      value={
                        loan.totalExpectedPaymentMinorUnits ??
                        loan.originalAmountMinorUnits
                      }
                    />
                  }
                />
                <DetailItem
                  label={t("details.paidAmount")}
                  value={
                    <CompactMoney
                      currency={currency}
                      value={loan.paidAmountMinorUnits}
                    />
                  }
                />
                <DetailItem
                  label={t("details.remainingBalance")}
                  value={
                    <CompactMoney
                      currency={currency}
                      value={loan.remainingBalanceMinorUnits}
                    />
                  }
                />
                <DetailItem
                  label={t("details.interestRate")}
                  value={formatInterestRate(loan.interestRateBasisPoints)}
                />
                <DetailItem
                  label={t("details.repaymentSchedule")}
                  value={repaymentFrequencyLabel(loan.repaymentFrequency)}
                />
                <DetailItem
                  label={t("details.startDate")}
                  value={formatDate(loan.startDate)}
                />
                <DetailItem
                  label={t("details.dueDate")}
                  value={formatDate(loan.dueDate)}
                />
                <DetailItem
                  label={t("details.borrower")}
                  value={loan.borrower}
                />
                <DetailItem label={t("details.lender")} value={loan.lender} />
                <DetailItem
                  label={t("details.paymentMethod")}
                  value={formatPaymentMethod(loan.paymentMethod)}
                />
                <DetailItem
                  label="Created by"
                  value={
                    loan.createdByName ??
                    loan.createdBy?.fullName ??
                    "Not recorded"
                  }
                />
                <DetailItem
                  label="Approved by"
                  value={
                    loan.approvedByName ??
                    loan.approvedBy?.fullName ??
                    "Not approved"
                  }
                />
                <DetailItem
                  label="Approved at"
                  value={
                    loan.approvedAt
                      ? formatDate(loan.approvedAt)
                      : "Not approved"
                  }
                />
              </section>
              {loan.notes ? (
                <div className="rounded-md border p-4">
                  <p className="font-medium text-sm">{t("details.notes")}</p>
                  <p className="mt-2 text-muted-foreground text-sm leading-6">
                    {loan.notes}
                  </p>
                </div>
              ) : null}
              <Separator />
              <Tabs defaultValue="repayments" className="gap-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="repayments">
                    {t("details.tabRepayments", {
                      count: loan.repayments?.length ?? 0,
                    })}
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    {t("details.tabDocuments", {
                      count: loan.documents?.length ?? 0,
                    })}
                  </TabsTrigger>
                  <TabsTrigger value="approvals">Approval Timeline</TabsTrigger>
                  <TabsTrigger value="audit">
                    {t("details.tabAudit")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="repayments">
                  <TimelineList
                    emptyTitle={t("details.noRepayments")}
                    icon={ReceiptTextIcon}
                    items={(loan.repayments ?? []).map((repayment) => ({
                      id: repayment.id,
                      title: (
                        <CompactMoney
                          currency={currency}
                          value={repayment.amountMinorUnits}
                        />
                      ),
                      description: `${formatDate(repayment.paymentDate)} by ${
                        repayment.paidBy
                      } to ${repayment.receivedBy}`,
                    }))}
                  />
                </TabsContent>
                <TabsContent value="documents">
                  <TimelineList
                    emptyTitle={t("details.noDocuments")}
                    icon={FileTextIcon}
                    items={(loan.documents ?? []).map((document) => ({
                      id: document.id,
                      title: document.fileName,
                      description: document.createdAt
                        ? formatDate(document.createdAt)
                        : "Private document",
                    }))}
                  />
                </TabsContent>
                <TabsContent value="approvals">
                  <TimelineList
                    emptyTitle="No approval events yet"
                    icon={ShieldCheckIcon}
                    items={[
                      {
                        id: "approval-status",
                        title: loan.approvalStatus,
                        description: loan.approvedAt
                          ? `Approved ${formatDate(loan.approvedAt)}`
                          : "Waiting for the money approvals workflow",
                      },
                    ]}
                  />
                </TabsContent>
                <TabsContent value="audit">
                  <TimelineList
                    emptyTitle={t("details.noAuditLogs")}
                    icon={HistoryIcon}
                    items={(loan.auditHistory ?? []).map((entry) => ({
                      id: entry.id,
                      title: entry.action,
                      description: `${formatDate(entry.createdAt)} by ${
                        entry.actorName ?? "System"
                      }${entry.note ? ` - ${entry.note}` : ""}`,
                    }))}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  );
}

function TimelineList({
  emptyTitle,
  icon: Icon,
  items,
}: {
  emptyTitle: string;
  icon: typeof CalendarClockIcon;
  items: { id: string; title: ReactNode; description: string }[];
}) {
  if (!items.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center">
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
        <p className="font-medium text-sm">{emptyTitle}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border p-3">
          <p className="font-medium text-sm">{item.title}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
