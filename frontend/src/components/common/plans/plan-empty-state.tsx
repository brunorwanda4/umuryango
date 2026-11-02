import { PlusIcon, RotateCcwIcon, TargetIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";

export function PlanEmptyState({
  hasPlans,
  onAdd,
  onResetFilters,
  isPersonal = true,
  customSlot,
}: {
  hasPlans: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
  isPersonal?: boolean;
  customSlot?: ReactNode;
}) {
  const t = createTranslator("SharedPlans");

  if (customSlot) {
    return <>{customSlot}</>;
  }

  const title = hasPlans
    ? t((m) => m.SharedPlans.noMatchingTitle)
    : isPersonal
      ? t((m) => m.SharedPlans.noPlansTitle)
      : t((m) => m.SharedPlans.noProjectsTitle);

  const desc = hasPlans
    ? t((m) => m.SharedPlans.noMatchingDesc)
    : isPersonal
      ? t((m) => m.SharedPlans.noPlansDesc)
      : t((m) => m.SharedPlans.noProjectsDesc);

  const actionLabel = isPersonal
    ? t((m) => m.SharedPlans.createFirstGoal)
    : t((m) => m.SharedPlans.createFirstProject);

  return (
    <Empty className="min-h-64 rounded-2xl border border-dashed border-border bg-card p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TargetIcon className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-sm">{desc}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {hasPlans && onResetFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="gap-1.5"
          >
            <RotateCcwIcon className="size-3.5" />
            <span>{t((m) => m.SharedPlans.clearFilters)}</span>
          </Button>
        ) : onAdd ? (
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <PlusIcon className="size-3.5" />
            <span>{actionLabel}</span>
          </Button>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
