import { TargetIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import type { SharedPlanSummary } from "./types";

export function PlanSummaryHero({
  summary,
  isPersonal = true,
}: {
  summary: SharedPlanSummary;
  isPersonal?: boolean;
}) {
  const t = createTranslator("SharedPlans");

  const titleLabel = isPersonal
    ? t((m) => m.SharedPlans.totalSaved)
    : t((m) => m.SharedPlans.totalFunded);

  const activeBadgeLabel = isPersonal
    ? t((m) => m.SharedPlans.activeGoals, { count: summary.activeCount })
    : t((m) => m.SharedPlans.activeProjects, { count: summary.activeCount });

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 transition-colors">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TargetIcon className="size-3.5 text-primary" />
          <span>{titleLabel}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {summary.overdueCount > 0 ? (
            <Badge variant="destructive" className="text-[10px] font-medium">
              {summary.overdueCount} Overdue
            </Badge>
          ) : null}
          <Badge
            variant="secondary"
            className="text-[10px] font-medium font-mono"
          >
            {activeBadgeLabel}
          </Badge>
        </div>
      </div>

      {/* Main Aggregated Value */}
      <div className="my-3 sm:my-3.5">
        {summary.hasFinancials ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
                <CompactMoney
                  currency={summary.currency}
                  value={summary.totalCurrentMinorUnits.toString()}
                />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t((m) => m.SharedPlans.fundedOfTarget, {
                target: "",
              })}
              <span className="font-semibold text-foreground ml-1">
                <CompactMoney
                  currency={summary.currency}
                  value={summary.totalTargetMinorUnits.toString()}
                />
              </span>
            </p>
          </div>
        ) : (
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {summary.completedCount} / {summary.totalCount}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks completed
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground font-medium">
            {t((m) => m.SharedPlans.overallProgress)}
          </span>
          <span className="font-bold text-foreground">
            {t((m) => m.SharedPlans.fundedPercent, {
              percent: summary.progressPercent,
            })}
          </span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden p-0.5 border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Sub-Metrics Strip (when financials exist) */}
      {summary.hasFinancials ? (
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-border">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block mb-0.5">
              {t((m) => m.SharedPlans.totalTargetCapital)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground font-mono">
              <CompactMoney
                currency={summary.currency}
                value={summary.totalTargetMinorUnits.toString()}
              />
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block mb-0.5">
              {t((m) => m.SharedPlans.remainingToTarget)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground font-mono">
              <CompactMoney
                currency={summary.currency}
                value={summary.totalRemainingMinorUnits.toString()}
              />
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
