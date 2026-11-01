"use client";

import { PieChartIcon } from "lucide-react";
import { useState } from "react";
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
import type { SharedCategoryItem } from "./types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#a855f7",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#f43f5e",
];

export interface CategoryBreakdownCardProps {
  expenseCategories: SharedCategoryItem[];
  incomeCategories: SharedCategoryItem[];
  currency?: string;
  className?: string;
}

export function CategoryBreakdownCard({
  expenseCategories,
  incomeCategories,
  currency = "RWF",
  className,
}: CategoryBreakdownCardProps) {
  const t = createTranslator("MoneyOverview");
  const [activeTab, setActiveTab] = useState<"expenses" | "income">("expenses");

  const currentList =
    activeTab === "expenses" ? expenseCategories : incomeCategories;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/90 bg-card p-4 sm:p-5 shadow-sm space-y-3.5 flex flex-col justify-between",
        className,
      )}
    >
      <div>
        {/* Header with Sub-pill toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
            {t((m) => m.MoneyOverview.categoryBreakdown)}
          </h3>

          <div
            role="tablist"
            className="flex items-center bg-muted/60 dark:bg-muted/40 rounded-lg p-0.5 border border-border/80 text-[11px] font-bold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                activeTab === "expenses"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t((m) => m.MoneyOverview.expensesTab)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "income"}
              onClick={() => setActiveTab("income")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                activeTab === "income"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t((m) => m.MoneyOverview.incomeTab)}
            </button>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        {currentList.length > 0 ? (
          <div
            className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden flex my-3"
            aria-hidden="true"
          >
            {currentList.map((item, index) => {
              const color = item.color || PALETTE[index % PALETTE.length];
              return (
                <div
                  key={item.id}
                  className="h-full transition-all"
                  style={{
                    width: `${Math.max(2, item.percentage)}%`,
                    backgroundColor: color,
                  }}
                  title={`${item.name}: ${item.percentage}%`}
                />
              );
            })}
          </div>
        ) : null}

        {/* Category Items List */}
        {currentList.length > 0 ? (
          <div className="space-y-2 pt-1">
            {currentList.map((item, index) => {
              const color = item.color || PALETTE[index % PALETTE.length];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="size-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-foreground font-medium">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-foreground">
                      {formatFullMinorUnits(item.amountMinorUnits, currency)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 tabular-nums">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PieChartIcon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </EmptyMedia>
              <EmptyTitle className="text-xs">
                {t((m) => m.MoneyOverview.noCategories)}
              </EmptyTitle>
              <EmptyDescription className="text-[11px]">
                {activeTab === "expenses"
                  ? t((m) => m.MoneyOverview.noTransactionsDesc)
                  : t((m) => m.MoneyOverview.noTransactionsDesc)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </Card>
  );
}
