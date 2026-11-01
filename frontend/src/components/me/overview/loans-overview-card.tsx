import { HandCoinsIcon } from "lucide-react";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardStatTile } from "@/components/common/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { CompactMoney } from "@/components/common/money/compact-money";
import type { PersonalLoan } from "@/components/money/loans/types-and-schemas";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import { addMinorUnits } from "./personal-overview-data";

export function LoansOverviewCard({
  currency,
  loans,
}: {
  currency: string;
  loans: PersonalLoan[];
}) {
  const t = createTranslator("PersonalOverview.loansCard");
  const active = loans.filter(
    (loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE",
  );
  const borrowed = active.filter((loan) => loan.type === "BORROWED");
  const lent = active.filter((loan) => loan.type === "LENT");
  const dueSoon = active.filter((loan) => {
    const days = (Date.parse(loan.dueDate) - Date.now()) / 86_400_000;
    return days >= 0 && days <= 7;
  });
  const urgent = [...active]
    .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate))
    .slice(0, 3);

  return (
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.loansCard.title)}
      description={t((m) => m.PersonalOverview.loansCard.description)}
      actionHref="/me/money/loans"
      actionLabel={t((m) => m.PersonalOverview.loansCard.openLoans)}
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        <DashboardStatTile
          label={t((m) => m.PersonalOverview.loansCard.totalBorrowed)}
          value={
            <CompactMoney
              currency={currency}
              value={addMinorUnits(
                ...borrowed.map((loan) => loan.originalAmountMinorUnits),
              ).toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.PersonalOverview.loansCard.totalLent)}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          value={
            <CompactMoney
              currency={currency}
              value={addMinorUnits(
                ...lent.map((loan) => loan.originalAmountMinorUnits),
              ).toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.PersonalOverview.loansCard.remainingStat)}
          value={
            <CompactMoney
              currency={currency}
              value={addMinorUnits(
                ...active.map((loan) => loan.remainingBalanceMinorUnits),
              ).toString()}
            />
          }
        />
        <DashboardStatTile
          label={t((m) => m.PersonalOverview.loansCard.dueInSevenDays)}
          valueClassName={
            dueSoon.length > 0
              ? "text-amber-600 dark:text-amber-400"
              : undefined
          }
          value={dueSoon.length}
        />
      </div>

      {loans.length === 0 ? (
        <DashboardEmptyState
          icon={<HandCoinsIcon aria-hidden="true" />}
          title={t((m) => m.PersonalOverview.loansCard.noLoansYet)}
          description={t((m) => m.PersonalOverview.loansCard.noLoansDesc)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {urgent.map((loan) => {
            const expected = BigInt(loan.totalExpectedAmountMinorUnits || "0");
            const paid = BigInt(loan.paidAmountMinorUnits || "0");
            const progress =
              expected > BigInt(0)
                ? Number((paid * BigInt(100)) / expected)
                : 0;
            const isOverdue = loan.status === "OVERDUE";

            return (
              <div
                key={loan.id}
                className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:p-3 text-xs transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        isOverdue
                          ? "bg-destructive"
                          : loan.type === "LENT"
                            ? "bg-emerald-500"
                            : "bg-amber-500",
                      )}
                      aria-hidden="true"
                    />
                    <p className="truncate font-semibold text-foreground">
                      {loan.title}
                    </p>
                  </div>
                  <Badge
                    variant={isOverdue ? "destructive" : "outline"}
                    className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-mono"
                  >
                    {loan.type === "BORROWED"
                      ? t((m) => m.PersonalOverview.loansCard.borrowed)
                      : t((m) => m.PersonalOverview.loansCard.lent)}
                  </Badge>
                </div>

                <Progress
                  value={progress}
                  className="h-1.5 w-full"
                  aria-label={t(
                    (m) => m.PersonalOverview.loansCard.repaidAria,
                    {
                      title: loan.title,
                      progress,
                    },
                  )}
                />

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">
                    {t((m) => m.PersonalOverview.loansCard.duePersonDate, {
                      name: loan.person.name,
                      date: new Date(loan.dueDate).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      }),
                    })}
                  </span>
                  <CompactMoney
                    className="font-mono font-medium text-foreground shrink-0"
                    currency={currency}
                    value={loan.remainingBalanceMinorUnits}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
