import { PersonalMoneyTransactionsTable } from "./personal-money-transactions-table";
import type { RealTransaction } from "./types";

export interface PersonalMoneyRecentTransactionsProps {
  transactions: RealTransaction[];
  currency?: string;
  limit?: number;
}

export function PersonalMoneyRecentTransactions({
  transactions,
  currency = "RWF",
  limit = 8,
}: PersonalMoneyRecentTransactionsProps) {
  const displayedItems = limit ? transactions.slice(0, limit) : transactions;

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-0.5">
        <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
          Recent transactions
        </h2>
        <p className="text-sm text-muted-foreground">
          Latest money activity across personal and family records.
        </p>
      </div>

      <PersonalMoneyTransactionsTable
        items={displayedItems}
        currency={currency}
      />
    </section>
  );
}
