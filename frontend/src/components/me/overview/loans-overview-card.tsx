import { ArrowRightIcon, HandCoinsIcon } from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
import type { PersonalLoan } from "@/components/money/loans/types-and-schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { addMinorUnits } from "./personal-overview-data";

export function LoansOverviewCard({
  currency,
  loans,
}: {
  currency: string;
  loans: PersonalLoan[];
}) {
  const active = loans.filter(
    (loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE",
  );
  const borrowed = active.filter((loan) => loan.type === "BORROWED");
  const lent = active.filter((loan) => loan.type === "LENT");
  const dueSoon = active.filter((loan) => {
    const days = (Date.parse(loan.dueDate) - Date.now()) / 86_400_000;
    return days >= 0 && days <= 7;
  });
  const urgent = [...active]
    .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loans and debts</CardTitle>
        <CardDescription>
          Money you have borrowed or lent to trusted people.
        </CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/me/money/loans">
              Open loans
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <LoanStat
            label="Total borrowed"
            currency={currency}
            value={addMinorUnits(
              ...borrowed.map((loan) => loan.originalAmountMinorUnits),
            ).toString()}
          />
          <LoanStat
            label="Total lent"
            currency={currency}
            value={addMinorUnits(
              ...lent.map((loan) => loan.originalAmountMinorUnits),
            ).toString()}
          />
          <LoanStat
            label="Remaining"
            currency={currency}
            value={addMinorUnits(
              ...active.map((loan) => loan.remainingBalanceMinorUnits),
            ).toString()}
          />
          <div className="rounded-xl bg-muted p-3">
            <p className="font-semibold text-lg">{dueSoon.length}</p>
            <p className="text-muted-foreground text-xs">Due in 7 days</p>
          </div>
        </div>
        {loans.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandCoinsIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No loans or debts yet</EmptyTitle>
              <EmptyDescription>
                Borrowed and lent money will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {urgent.map((loan) => {
              const expected = BigInt(
                loan.totalExpectedAmountMinorUnits || "0",
              );
              const paid = BigInt(loan.paidAmountMinorUnits || "0");
              const progress =
                expected > BigInt(0)
                  ? Number((paid * BigInt(100)) / expected)
                  : 0;
              return (
                <div key={loan.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {loan.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {loan.person.name} · Due{" "}
                        {new Date(loan.dueDate).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        loan.status === "OVERDUE" ? "destructive" : "outline"
                      }
                    >
                      {loan.type === "BORROWED" ? "Borrowed" : "Lent"}
                    </Badge>
                  </div>
                  <Progress
                    value={progress}
                    aria-label={`${loan.title} is ${progress}% repaid`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoanStat({
  currency,
  label,
  value,
}: {
  currency: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-muted p-3">
      <p className="truncate font-semibold text-lg">
        <CompactMoney currency={currency} value={value} />
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
