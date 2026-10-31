import { HandCoinsIcon } from "lucide-react";
import { DashboardEmptyState } from "@/components/common/dashboard/dashboard-empty-state";
import { DashboardStatTile } from "@/components/common/dashboard/dashboard-metric-card";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { CompactMoney } from "@/components/common/money/compact-money";
import type { PersonalLoan } from "@/components/money/loans/types-and-schemas";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";
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
      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-4">
          {urgent.map((loan) => {
            const expected = BigInt(loan.totalExpectedAmountMinorUnits || "0");
            const paid = BigInt(loan.paidAmountMinorUnits || "0");
            const progress =
              expected > BigInt(0)
                ? Number((paid * BigInt(100)) / expected)
                : 0;
            return (
              <div key={loan.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{loan.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t((m) => m.PersonalOverview.loansCard.duePersonDate, {
                        name: loan.person.name,
                        date: new Date(loan.dueDate).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        }),
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      loan.status === "OVERDUE" ? "destructive" : "outline"
                    }
                  >
                    {loan.type === "BORROWED"
                      ? t((m) => m.PersonalOverview.loansCard.borrowed)
                      : t((m) => m.PersonalOverview.loansCard.lent)}
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  aria-label={t(
                    (m) => m.PersonalOverview.loansCard.repaidAria,
                    {
                      title: loan.title,
                      progress,
                    },
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
