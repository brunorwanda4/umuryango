"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import {
  formatCompactMinorUnits,
  formatFullMinorUnits,
} from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";
import type { SharedCashFlowPoint } from "./types";

export interface CashflowHeroCardProps {
  label?: string;
  badgeLabel?: string;
  netMinorUnits: string;
  incomeMinorUnits: string;
  expenseMinorUnits: string;
  currency?: string;
  subtitle?: ReactNode;
  incomeMeta?: ReactNode;
  expenseMeta?: ReactNode;
  cashFlowPoints?: SharedCashFlowPoint[];
  className?: string;
}

export function CashflowHeroCard({
  label,
  badgeLabel,
  netMinorUnits,
  incomeMinorUnits,
  expenseMinorUnits,
  currency = "RWF",
  subtitle,
  incomeMeta,
  expenseMeta,
  cashFlowPoints = [],
  className,
}: CashflowHeroCardProps) {
  const t = createTranslator("MoneyOverview");
  const isNegative = netMinorUnits.startsWith("-") && netMinorUnits !== "-0";
  const isZero =
    netMinorUnits === "0" || netMinorUnits === "-0" || netMinorUnits === "";

  const resolvedLabel = label ?? t((m) => m.MoneyOverview.netCashflow);

  const defaultSubtitle = isZero
    ? t((m) => m.MoneyOverview.neutralCashflowDesc)
    : isNegative
      ? t((m) => m.MoneyOverview.negativeCashflowDesc)
      : t((m) => m.MoneyOverview.positiveCashflowDesc);

  const maxVal = Math.max(
    1,
    ...cashFlowPoints.map((p) =>
      Math.max(
        Number(p.incomeMinorUnits) || 0,
        Number(p.expenseMinorUnits) || 0,
      ),
    ),
  );

  const hasActivity =
    cashFlowPoints.length > 0 &&
    cashFlowPoints.some(
      (p) =>
        (Number(p.incomeMinorUnits) || 0) > 0 ||
        (Number(p.expenseMinorUnits) || 0) > 0,
    );

  return (
    <Card
      className={cn(
        "rounded-2xl sm:rounded-3xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between gap-4",
        className,
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {resolvedLabel}
        </span>
        {badgeLabel ? (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/80 bg-muted/30"
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </div>

      {/* Hero Figure */}
      <div className="my-0.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h2
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-mono",
              isNegative
                ? "text-rose-500 dark:text-rose-400"
                : isZero
                  ? "text-foreground"
                  : "text-foreground",
            )}
          >
            {!isNegative && !isZero ? "+" : ""}
            {formatFullMinorUnits(netMinorUnits, currency)}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {subtitle ?? defaultSubtitle}
        </p>
      </div>

      {/* Split Income vs Expense Tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-3 border-t border-border/70">
        {/* Income Subcard */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span
              className="size-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <ArrowDownLeftIcon className="size-3 stroke-[2.5]" />
            </span>
            <span className="truncate font-medium">
              {t((m) => m.MoneyOverview.totalIncome)}
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-500 dark:text-emerald-400 tabular-nums">
            +{formatFullMinorUnits(incomeMinorUnits, currency)}
          </div>
          {incomeMeta ? (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {incomeMeta}
            </div>
          ) : null}
        </div>

        {/* Expense Subcard */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span
              className="size-5 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <ArrowUpRightIcon className="size-3 stroke-[2.5]" />
            </span>
            <span className="truncate font-medium">
              {t((m) => m.MoneyOverview.totalExpenses)}
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-rose-500 dark:text-rose-400 tabular-nums">
            -{formatFullMinorUnits(expenseMinorUnits, currency)}
          </div>
          {expenseMeta ? (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {expenseMeta}
            </div>
          ) : null}
        </div>
      </div>

      {/* Weekly/Period Cashflow Performance Chart */}
      <div className="pt-3 border-t border-border/70 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium">
            {t((m) => m.MoneyOverview.performanceTitle)}
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span
                className="size-2 rounded-xs bg-emerald-500"
                aria-hidden="true"
              />
              <span>{t((m) => m.MoneyOverview.inflow)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span
                className="size-2 rounded-xs bg-rose-500"
                aria-hidden="true"
              />
              <span>{t((m) => m.MoneyOverview.outflow)}</span>
            </span>
          </div>
        </div>

        {hasActivity ? (
          <div className="h-20 flex items-end justify-between gap-2 pt-1 px-1">
            {cashFlowPoints.map((point, index) => {
              const incVal = Number(point.incomeMinorUnits) || 0;
              const expVal = Number(point.expenseMinorUnits) || 0;
              const incHeight =
                maxVal > 0 && incVal > 0
                  ? Math.max(
                      8,
                      Math.min(100, Math.round((incVal / maxVal) * 100)),
                    )
                  : 0;
              const expHeight =
                maxVal > 0 && expVal > 0
                  ? Math.max(
                      8,
                      Math.min(100, Math.round((expVal / maxVal) * 100)),
                    )
                  : 0;

              return (
                <div
                  key={`${point.label}-${index}`}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-13">
                    <div
                      className="w-2 sm:w-2.5 bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                      style={{ height: `${incHeight}%` }}
                      title={`${t((m) => m.MoneyOverview.inflow)}: ${formatCompactMinorUnits(point.incomeMinorUnits, currency)}`}
                    />
                    <div
                      className="w-2 sm:w-2.5 bg-rose-500/90 rounded-t transition-all group-hover:bg-rose-400"
                      style={{ height: `${expHeight}%` }}
                      title={`${t((m) => m.MoneyOverview.outflow)}: ${formatCompactMinorUnits(point.expenseMinorUnits, currency)}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            {t((m) => m.MoneyOverview.noCashflowData)}
          </div>
        )}
      </div>
    </Card>
  );
}
