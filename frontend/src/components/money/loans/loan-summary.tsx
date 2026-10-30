import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CircleDollarSignIcon,
  ClockIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import type { PersonalLoan } from "./types-and-schemas";

export function LoanSummary({
  currency,
  loans,
}: {
  currency: string;
  loans: PersonalLoan[];
}) {
  const totals = loans.reduce(
    (sum, loan) => ({
      borrowed:
        sum.borrowed +
        (loan.type === "BORROWED"
          ? BigInt(loan.originalAmountMinorUnits || "0")
          : BigInt(0)),
      lent:
        sum.lent +
        (loan.type === "LENT"
          ? BigInt(loan.originalAmountMinorUnits || "0")
          : BigInt(0)),
      repaid: sum.repaid + BigInt(loan.paidAmountMinorUnits || "0"),
      remaining: sum.remaining + BigInt(loan.remainingBalanceMinorUnits || "0"),
    }),
    {
      borrowed: BigInt(0),
      lent: BigInt(0),
      repaid: BigInt(0),
      remaining: BigInt(0),
    },
  );

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
      cardHeaderClassName="flex-col items-start justify-between gap-4 py-4"
      cardTitleClassName="whitespace-normal leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      iconPosition="start"
      cards={[
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Total borrowed",
          iconSource: {
            image: { src: "/images/icons/borrowing.png" },
            line: ArrowDownToLineIcon,
          },
          value: (
            <CompactMoney
              currency={currency}
              value={totals.borrowed.toString()}
            />
          ),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Total lent",
          iconSource: {
            image: { src: "/images/icons/lent.png" },
            line: ArrowUpFromLineIcon,
          },
          value: (
            <CompactMoney currency={currency} value={totals.lent.toString()} />
          ),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Total repaid",
          iconSource: {
            image: { src: "/images/icons/repaid.png" },
            line: CircleDollarSignIcon,
          },
          value: (
            <CompactMoney
              currency={currency}
              value={totals.repaid.toString()}
            />
          ),
        },
        {
          className: " border-border/80 py-0 shadow-sm",
          description: "Total remaining",
          iconSource: {
            image: { src: "/images/icons/clock.png" },
            line: ClockIcon,
          },
          value: (
            <CompactMoney
              currency={currency}
              value={totals.remaining.toString()}
            />
          ),
        },
      ]}
    />
  );
}
