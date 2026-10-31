import { createTranslator } from "@/i18n/translate";
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
  const t = createTranslator("PersonalMoney");
  const displayedItems = limit ? transactions.slice(0, limit) : transactions;

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-0.5">
        <h2 className="font-fraunces text-xl font-semibold tracking-tight text-foreground">
          {t((m) => m.PersonalMoney.recentTransactions.title)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t((m) => m.PersonalMoney.recentTransactions.description)}
        </p>
      </div>

      <PersonalMoneyTransactionsTable
        items={displayedItems}
        currency={currency}
      />
    </section>
  );
}
