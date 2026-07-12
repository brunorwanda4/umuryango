"use client";

import { ExternalLinkIcon, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { formatDate } from "@/components/family/money/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <Sheet open={Boolean(loan)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{loan?.title ?? "Loan details"}</SheetTitle>
          <SheetDescription>
            {loan
              ? loan.type === "BORROWED"
                ? `Borrowed from ${loan.person.name}`
                : `Lent to ${loan.person.name}`
              : "Personal loan details"}
          </SheetDescription>
        </SheetHeader>
        {loan ? (
          <div className="flex flex-col gap-6 px-4 pb-6">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback>{initials(loan.person.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{loan.person.name}</p>
                <p className="text-sm text-muted-foreground">
                  {loan.person.relationship ?? "Trusted person"}
                </p>
              </div>
              <Badge variant="secondary">
                {loan.status === "REPAID"
                  ? "Repaid"
                  : loan.status[0] + loan.status.slice(1).toLowerCase()}
              </Badge>
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
              View person
            </Button>
            <Separator />
            <dl className="grid grid-cols-2 gap-5">
              <Detail label="Loan type">
                {loan.type === "BORROWED" ? "Borrowed" : "Lent"}
              </Detail>
              <Detail label="Original amount">
                <CompactMoney
                  currency={loan.currency}
                  value={loan.originalAmountMinorUnits}
                />
              </Detail>
              <Detail label="Total paid">
                <CompactMoney
                  currency={loan.currency}
                  value={loan.paidAmountMinorUnits}
                />
              </Detail>
              <Detail label="Remaining balance">
                <CompactMoney
                  currency={loan.currency}
                  value={loan.remainingBalanceMinorUnits}
                />
              </Detail>
              <Detail label="Start date">{formatDate(loan.startDate)}</Detail>
              <Detail label="Due date">{formatDate(loan.dueDate)}</Detail>
            </dl>
            <LoanProgress value={getLoanProgress(loan)} />
            {loan.notes ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                <p className="text-sm text-muted-foreground">{loan.notes}</p>
              </div>
            ) : null}
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold">Payment history</h3>
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
      </SheetContent>
    </Sheet>
  );
}
