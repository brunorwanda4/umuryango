import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  FileTextIcon,
  InfoIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { formatRf } from "./formatters";
import { totalIncomeMinorUnits } from "./income-dashboard-data";

export function IncomeSummaryCards() {
  const iconClassName = "size-5 text-chart-2";
  const iconWrapperClassName =
    "flex size-10 items-center justify-center rounded-xl bg-chart-2/10";
  const descriptionWithInfo = (label: string) => (
    <span className="inline-flex items-center gap-2">
      {label}
      <InfoIcon className="size-3.5" aria-hidden="true" />
    </span>
  );

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium [&>span:last-child]:hidden"
      cardFooterClassName="mt-4 font-semibold text-sm"
      cardHeaderClassName="min-h-[10.75rem] flex-col items-start justify-between gap-4 p-5 sm:p-6"
      cardTitleClassName="mt-2 whitespace-normal text-2xl font-bold leading-tight tracking-normal sm:text-3xl"
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
          icon: (
            <span className={iconWrapperClassName}>
              <WalletCardsIcon className={iconClassName} aria-hidden="true" />
            </span>
          ),
          value: formatRf(totalIncomeMinorUnits),
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
          icon: (
            <span className={iconWrapperClassName}>
              <FileTextIcon className={iconClassName} aria-hidden="true" />
            </span>
          ),
          value: "90",
        },
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("This month's income"),
          footer: <span className="text-chart-2">Jul 1 - Jul 31, 2026</span>,
          icon: (
            <span className={iconWrapperClassName}>
              <CalendarDaysIcon className={iconClassName} aria-hidden="true" />
            </span>
          ),
          value: formatRf(90000),
        },
        {
          className: "rounded-2xl border-border/80 py-0 shadow-sm",
          description: descriptionWithInfo("Largest income"),
          footer: <span className="text-chart-2">Business income</span>,
          icon: (
            <span className={iconWrapperClassName}>
              <TrendingUpIcon className={iconClassName} aria-hidden="true" />
            </span>
          ),
          value: formatRf(40000),
        },
      ]}
    />
  );
}
