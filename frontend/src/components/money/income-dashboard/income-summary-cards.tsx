import { ArrowDownIcon, ArrowUpRightIcon, InfoIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";

export function IncomeSummaryCards({
  periodLabel,
  summary,
}: {
  periodLabel: string;
  summary: {
    allTimeTotalMinorUnits: string;
    approvedTransactionCount: number;
    largestIncome: {
      amountMinorUnits: string;
      category: string;
      description: string | null;
    } | null;
    periodTotalMinorUnits: string;
  };
}) {
  const descriptionWithInfo = (label: string) => (
    <span className="inline-flex items-center gap-2">
      {label}
      <InfoIcon className="size-3.5" aria-hidden="true" />
    </span>
  );

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
      cardFooterClassName="sm:mt-4 font-semibold text-sm"
      cardHeaderClassName="min-h-[10.75rem] flex-col items-start justify-between gap-4 p-5 sm:p-6"
      cardTitleClassName="sm:mt-2 whitespace-normal  leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4"
      iconPosition="start"
      cards={[
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("Total income"),
          footer: (
            <span className="flex items-center gap-2 text-chart-2">
              All time
              <ArrowDownIcon className="size-4" aria-hidden="true" />
            </span>
          ),
          iconImage: "/images/icons/wallet.png",
          value: (
            <CompactMoney
              currency="RWF"
              value={summary.allTimeTotalMinorUnits}
            />
          ),
        },
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("Income transactions"),
          footer: (
            <span className="flex items-center gap-2 text-chart-2">
              All time
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </span>
          ),
          iconImage: "/images/icons/transaction.png",
          value: summary.approvedTransactionCount.toString(),
        },
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("This month's income"),
          footer: <span className="text-chart-2">{periodLabel}</span>,
          iconImage: "/images/icons/calendar.png",
          value: (
            <CompactMoney
              currency="RWF"
              value={summary.periodTotalMinorUnits}
            />
          ),
        },
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("Largest income"),
          footer: (
            <span className="text-chart-2">
              {summary.largestIncome?.description ??
                summary.largestIncome?.category ??
                "No approved income"}
            </span>
          ),
          iconImage: "/images/icons/quality.png",
          value: (
            <CompactMoney
              currency="RWF"
              emptyLabel="No records"
              value={summary.largestIncome?.amountMinorUnits}
            />
          ),
        },
      ]}
    />
  );
}
