import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CircleDollarSignIcon,
  WalletCardsIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import type { PersonalLoan } from "./types-and-schemas";

export function LoanSummary({ currency, loans }: { currency: string; loans: PersonalLoan[] }) {
  const totals = loans.reduce(
    (sum, loan) => ({
      borrowed:
        sum.borrowed +
        (loan.type === "BORROWED" ? BigInt(loan.originalAmountMinorUnits) : BigInt(0)),
      lent: sum.lent + (loan.type === "LENT" ? BigInt(loan.originalAmountMinorUnits) : BigInt(0)),
      repaid: sum.repaid + BigInt(loan.paidAmountMinorUnits),
      remaining: sum.remaining + BigInt(loan.remainingBalanceMinorUnits),
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
      className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      cardHeaderClassName="min-h-40 flex-col items-start justify-between gap-4 p-5 sm:p-6"
      cardDescriptionClassName="text-sm font-medium text-muted-foreground"
      cardTitleClassName="whitespace-normal leading-tight sm:text-3xl"
      iconPosition="start"
      cards={[
        {
          description: "Total borrowed",
          value: <CompactMoney currency={currency} value={totals.borrowed.toString()} />,
          iconImage: "/images/icons/borrowing.png",
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
        },
        {
          description: "Total lent",
          value: <CompactMoney currency={currency} value={totals.lent.toString()} />,
          iconImage: "/images/icons/lent.png",
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
        },
        {
          description: "Total repaid",
          value: <CompactMoney currency={currency} value={totals.repaid.toString()} />,
          iconImage: "/images/icons/repaid.png",
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
        },
        {
          description: "Total remaining",
          value: <CompactMoney currency={currency} value={totals.remaining.toString()} />,
          iconImage: "/images/icons/clock.png",
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
        },
      ]}
    />
  );
}
