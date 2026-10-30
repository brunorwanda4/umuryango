import { PlusIcon } from "lucide-react";
import type { PersonPlan } from "@/components/plans/types-and-schemas";
import { Button } from "@/components/ui/button";
import { formatFullRwf } from "./formatters";

export interface PersonalMoneySavingsCardProps {
  goal: PersonPlan | null;
  currency: string;
  onAddGoal: () => void;
}

export function PersonalMoneySavingsCard({
  goal,
  currency,
  onAddGoal,
}: PersonalMoneySavingsCardProps) {
  if (!goal) {
    return (
      <section className="flex flex-col justify-between rounded-[20px] border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-fraunces text-xl font-semibold text-foreground">
              Next savings goal
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No active savings goal set yet.
          </p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddGoal}
            className="rounded-full font-semibold"
          >
            <PlusIcon className="size-4" data-icon="inline-start" />
            Create savings goal
          </Button>
        </div>
      </section>
    );
  }

  const saved = Number(goal.currentAmountMinorUnits || 0);
  const target = Math.max(1, Number(goal.targetAmountMinorUnits || 0));
  const remaining = Math.max(0, target - saved);
  const pct = Math.min(100, Math.round((saved / target) * 100));

  return (
    <section className="rounded-[20px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-3.5">
        <h2 className="font-fraunces text-xl font-semibold text-foreground">
          Next savings goal
        </h2>
        <p className="text-sm text-muted-foreground">{goal.title}</p>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between py-2 text-[15px]">
          <span className="text-muted-foreground">Saved</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(saved, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Target</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(target, currency)}
          </b>
        </div>
        <div className="flex justify-between border-t border-border py-2 text-[15px]">
          <span className="text-muted-foreground">Remaining</span>
          <b className="font-semibold text-foreground">
            {formatFullRwf(remaining, currency)}
          </b>
        </div>
      </div>

      <div className="my-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-violet-600 transition-all dark:bg-violet-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {pct}% of your goal reached
      </p>
    </section>
  );
}
