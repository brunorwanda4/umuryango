import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  FileTextIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";
import { formatRf } from "./formatters";
import { totalIncomeMinorUnits } from "./income-dashboard-data";
import { IncomeSummaryCard } from "./income-summary-card";

export function IncomeSummaryCards() {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Income summary"
    >
      <IncomeSummaryCard
        description="Total income"
        icon={<WalletCardsIcon className="size-5" aria-hidden="true" />}
        value={formatRf(totalIncomeMinorUnits)}
        footer={
          <>
            <span>All time</span>
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </>
        }
      />
      <IncomeSummaryCard
        description="Income transactions"
        icon={<FileTextIcon className="size-5" aria-hidden="true" />}
        value="90"
        footer={
          <>
            <span>All time</span>
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
          </>
        }
      />
      <IncomeSummaryCard
        description="This month's income"
        icon={<CalendarDaysIcon className="size-5" aria-hidden="true" />}
        value={formatRf(90000)}
        footer={<span>Jul 1 - Jul 31, 2026</span>}
      />
      <IncomeSummaryCard
        description="Largest income"
        icon={<TrendingUpIcon className="size-5" aria-hidden="true" />}
        value={formatRf(40000)}
        footer={<span>Business income</span>}
      />
    </section>
  );
}
