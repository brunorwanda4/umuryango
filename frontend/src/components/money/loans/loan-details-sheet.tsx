"use client";

import { ExternalLinkIcon, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { formatDate } from "@/components/family/money/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { LoanPaymentHistory } from "./loan-payment-history";
import { LoanProgress } from "./loan-progress";
import {
  getLoanProgress,
  type LoanPayment,
  type PersonalLoan,
} from "./types-and-schemas";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export function LoanDetailsSheet({
  familyId,
  familySlug,
  loan,
  onOpenChange,
}: {
  familyId: string;
  familySlug: string;
  loan: PersonalLoan | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = createTranslator("PersonalLoans");
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loan) return;
    setLoading(true);
    apiRequest<undefined, LoanPayment[]>(
      "get",
      `/families/${encodeURIComponent(familyId)}/money/loans/${encodeURIComponent(loan.id)}/repayments`,
    )
      .then((response) => setPayments(response.ok ? (response.data ?? []) : []))
      .finally(() => setLoading(false));
  }, [familyId, loan]);

  const statusLabel = loan
    ? loan.status === "REPAID"
      ? t((m) => m.PersonalLoans.filters.repaid)
      : loan.status === "ACTIVE"
        ? t((m) => m.PersonalLoans.filters.active)
        : loan.status === "OVERDUE"
          ? t((m) => m.PersonalLoans.filters.overdue)
          : t((m) => m.PersonalLoans.filters.cancelled)
    : "";

  return (
    <Dialog open={Boolean(loan)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {loan?.title ?? t((m) => m.PersonalLoans.details.title)}
          </DialogTitle>
          <DialogDescription>
            {loan
              ? loan.type === "BORROWED"
                ? t((m) => m.PersonalLoans.item.borrowedFrom, {
                    name: loan.person.name,
                  })
                : t((m) => m.PersonalLoans.item.lentTo, {
                    name: loan.person.name,
                  })
              : t((m) => m.PersonalLoans.details.defaultDesc)}
          </DialogDescription>
        </DialogHeader>
        {loan ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback>{initials(loan.person.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{loan.person.name}</p>
                <p className="text-sm text-muted-foreground">
                  {loan.person.relationship ??
                    t((m) => m.PersonalLoans.details.trustedPerson)}
                </p>
              </div>
              <Badge variant="secondary">{statusLabel}</Badge>
            </div>
            {loan.person.phoneNumber ? (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {loan.person.phoneNumber}
              </div>
            ) : null}
            <Button
              variant="outline"
              href={`/family/${encodeURIComponent(familySlug)}/contacts?view=${encodeURIComponent(loan.person.id)}`}
            >
              <ExternalLinkIcon aria-hidden="true" data-icon="inline-start" />
              {t((m) => m.PersonalLoans.details.viewPerson)}
            </Button>
            <Separator />
            <dl className="grid grid-cols-2 gap-5">
              <Detail label={t((m) => m.PersonalLoans.details.loanType)}>
                {loan.type === "BORROWED"
                  ? t((m) => m.PersonalLoans.form.borrowed)
                  : t((m) => m.PersonalLoans.form.lent)}
              </Detail>
              <Detail label={t((m) => m.PersonalLoans.details.originalAmount)}>
                <CompactMoney
                  currency={loan.currency}
                  value={loan.originalAmountMinorUnits}
                />
              </Detail>
              <Detail label={t((m) => m.PersonalLoans.details.totalPaid)}>
                <CompactMoney
                  currency={loan.currency}
                  value={loan.paidAmountMinorUnits}
                />
              </Detail>
              <Detail
                label={t((m) => m.PersonalLoans.details.remainingBalance)}
              >
                <CompactMoney
                  currency={loan.currency}
                  value={loan.remainingBalanceMinorUnits}
                />
              </Detail>
              <Detail label={t((m) => m.PersonalLoans.details.startDate)}>
                {formatDate(loan.startDate)}
              </Detail>
              <Detail label={t((m) => m.PersonalLoans.details.dueDate)}>
                {formatDate(loan.dueDate)}
              </Detail>
            </dl>
            <LoanProgress value={getLoanProgress(loan)} />
            {loan.notes ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t((m) => m.PersonalLoans.details.notes)}
                </h3>
                <p className="text-sm text-muted-foreground">{loan.notes}</p>
              </div>
            ) : null}
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold">
                {t((m) => m.PersonalLoans.details.paymentHistory)}
              </h3>
              {loading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <LoanPaymentHistory
                  currency={loan.currency}
                  payments={payments}
                />
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
