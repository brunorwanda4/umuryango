import {
  AlertTriangleIcon,
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  HandCoinsIcon,
  ListChecksIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { isLoanDueThisMonth, isLoanOverdue, toMinorNumber } from "./loan-utils";
import type { LoanRecord } from "./types-and-schemas";

export function LoanSummaryCards({
  currency,
  loans,
}: {
  currency: string;
  loans: LoanRecord[];
}) {
  const t = createTranslator("FamilyLoans");

  const summary = loans.reduce(
    (totals, loan) => {
      const original = toMinorNumber(loan.originalAmountMinorUnits);
      const paid = toMinorNumber(loan.paidAmountMinorUnits);
      const remaining = toMinorNumber(loan.remainingBalanceMinorUnits);

      if (loan.type === "MONEY_BORROWED") totals.borrowed += original;
      if (loan.type === "MONEY_LENT") totals.lent += original;

      totals.outstanding += remaining;
      totals.paid += paid;
      if (isLoanDueThisMonth(loan)) totals.dueThisMonth += 1;
      if (isLoanOverdue(loan)) totals.overdue += 1;
      if (loan.status === "COMPLETED") totals.completed += 1;
      if (loan.status !== "COMPLETED" && loan.status !== "CANCELLED") {
        totals.active += 1;
      }

      return totals;
    },
    {
      borrowed: 0,
      lent: 0,
      outstanding: 0,
      paid: 0,
      dueThisMonth: 0,
      overdue: 0,
      active: 0,
      completed: 0,
    },
  );

  const cards = [
    {
      title: t("cards.totalBorrowedTitle"),
      description: t("cards.totalBorrowedDesc"),
      value: summary.borrowed,
      icon: BanknoteArrowDownIcon,
      isMoney: true,
    },
    {
      title: t("cards.totalLentTitle"),
      description: t("cards.totalLentDesc"),
      value: summary.lent,
      icon: BanknoteArrowUpIcon,
      isMoney: true,
    },
    {
      title: t("cards.totalOutstandingTitle"),
      description: t("cards.totalOutstandingDesc"),
      value: summary.outstanding,
      icon: CircleDollarSignIcon,
      isMoney: true,
    },
    {
      title: t("cards.totalPaidTitle"),
      description: t("cards.totalPaidDesc"),
      value: summary.paid,
      icon: HandCoinsIcon,
      isMoney: true,
    },
    {
      title: t("cards.dueThisMonthTitle"),
      description: t("cards.dueThisMonthDesc"),
      value: summary.dueThisMonth.toLocaleString(),
      icon: CalendarClockIcon,
    },
    {
      title: t("cards.overdueLoansTitle"),
      description: t("cards.overdueLoansDesc"),
      value: summary.overdue.toLocaleString(),
      icon: AlertTriangleIcon,
    },
    {
      title: t("cards.activeLoansTitle"),
      description: t("cards.activeLoansDesc"),
      value: summary.active.toLocaleString(),
      icon: ListChecksIcon,
    },
    {
      title: t("cards.completedLoansTitle"),
      description: t("cards.completedLoansDesc"),
      value: summary.completed.toLocaleString(),
      icon: CheckCircle2Icon,
    },
  ];

  return (
    <section
      aria-label="Loan summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader>
              <CardAction>
                <Icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </CardAction>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-2xl tracking-tight">
                {card.isMoney ? (
                  <CompactMoney currency={currency} value={card.value} />
                ) : (
                  card.value
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
