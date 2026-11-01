"use client";

import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  ReceiptIcon,
  WalletCardsIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { formatFullMinorUnits } from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";
import { TransactionReceiptDialog } from "./transaction-receipt-dialog";
import type { SharedTransactionItem } from "./types";

export interface TransactionLedgerCardProps {
  transactions: SharedTransactionItem[];
  currency?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
  actionSlot?: React.ReactNode;
}

export function TransactionLedgerCard({
  transactions,
  currency = "RWF",
  limit,
  showFilters = true,
  className,
  actionSlot,
}: TransactionLedgerCardProps) {
  const t = createTranslator("MoneyOverview");
  const [filter, setFilter] = useState<
    "all" | "income" | "expense" | "contribution"
  >("all");
  const [selectedTx, setSelectedTx] = useState<SharedTransactionItem | null>(
    null,
  );
  const [receiptOpen, setReceiptOpen] = useState(false);

  const filteredItems = useMemo(() => {
    let list = transactions;
    if (filter === "income") {
      list = list.filter((t) => t.type === "income");
    } else if (filter === "expense") {
      list = list.filter((t) => t.type === "expense");
    } else if (filter === "contribution") {
      list = list.filter(
        (t) => t.type === "contribution" || t.type === "transfer",
      );
    }
    return limit ? list.slice(0, limit) : list;
  }, [transactions, filter, limit]);

  const handleRowClick = (tx: SharedTransactionItem) => {
    setSelectedTx(tx);
    setReceiptOpen(true);
  };

  return (
    <>
      <Card
        className={cn(
          "rounded-2xl border border-border/90 bg-card p-4 sm:p-5 shadow-sm space-y-3.5",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
              {t((m) => m.MoneyOverview.transactionLedger)}
            </h3>
            <Badge
              variant="secondary"
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              {t((m) => m.MoneyOverview.itemCount, {
                count: transactions.length,
              })}
            </Badge>
          </div>

          {actionSlot}
        </div>

        {/* Filter Pills */}
        {showFilters && transactions.length > 0 ? (
          <fieldset
            aria-label="Filter transactions"
            className="border-0 p-0 m-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-muted-foreground"
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer",
                filter === "all"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-muted/70 hover:text-foreground",
              )}
            >
              {t((m) => m.MoneyOverview.filterAll)}
            </button>
            <button
              type="button"
              onClick={() => setFilter("income")}
              className={cn(
                "px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer",
                filter === "income"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-muted/70 hover:text-foreground",
              )}
            >
              {t((m) => m.MoneyOverview.filterIncome)}
            </button>
            <button
              type="button"
              onClick={() => setFilter("expense")}
              className={cn(
                "px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer",
                filter === "expense"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-muted/70 hover:text-foreground",
              )}
            >
              {t((m) => m.MoneyOverview.filterExpenses)}
            </button>
          </fieldset>
        ) : null}

        {/* Transaction Items */}
        {filteredItems.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {filteredItems.map((tx) => {
              const isIncome = tx.type === "income";
              const isExpense = tx.type === "expense";
              const isContribution =
                tx.type === "contribution" || tx.type === "transfer";

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => handleRowClick(tx)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/60 cursor-pointer flex items-center justify-between transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                        isIncome
                          ? "bg-emerald-500/10 text-emerald-500"
                          : isExpense
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-purple-500/10 text-purple-500",
                      )}
                      aria-hidden="true"
                    >
                      {isIncome ? (
                        <ArrowDownLeftIcon className="size-4 stroke-[2.5]" />
                      ) : isExpense ? (
                        <ArrowUpRightIcon className="size-4 stroke-[2.5]" />
                      ) : isContribution ? (
                        <WalletCardsIcon className="size-4 stroke-[2]" />
                      ) : (
                        <ArrowLeftRightIcon className="size-4 stroke-[2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tx.subtitle ??
                          (tx.category
                            ? `${tx.category}${tx.paymentMethod ? ` • ${tx.paymentMethod}` : ""}`
                            : (tx.paymentMethod ?? tx.date))}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold block tabular-nums",
                        isIncome
                          ? "text-emerald-500 dark:text-emerald-400"
                          : isExpense
                            ? "text-rose-500 dark:text-rose-400"
                            : "text-foreground",
                      )}
                    >
                      {isIncome ? "+" : isExpense ? "-" : ""}
                      {formatFullMinorUnits(tx.amountMinorUnits, currency)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-sans mt-0.5">
                      {tx.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptIcon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </EmptyMedia>
              <EmptyTitle className="text-xs">
                {t((m) => m.MoneyOverview.noTransactions)}
              </EmptyTitle>
              <EmptyDescription className="text-[11px]">
                {t((m) => m.MoneyOverview.noTransactionsDesc)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Card>

      <TransactionReceiptDialog
        transaction={selectedTx}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </>
  );
}
