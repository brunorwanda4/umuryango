import { HandCoinsIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
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

export function LoanEmptyState({
  hasLoans,
  onAdd,
  onResetFilters,
  customSlot,
}: {
  hasLoans: boolean;
  onAdd?: () => void;
  onResetFilters?: () => void;
  customSlot?: ReactNode;
}) {
  const t = createTranslator("SharedLoans");

  if (customSlot) {
    return <>{customSlot}</>;
  }

  return (
    <Empty className="min-h-64 rounded-2xl border border-dashed border-border bg-card p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HandCoinsIcon className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>
          {hasLoans
            ? t((m) => m.SharedLoans.noFilteredTitle)
            : t((m) => m.SharedLoans.noLoansTitle)}
        </EmptyTitle>
        <EmptyDescription className="max-w-sm">
          {hasLoans
            ? t((m) => m.SharedLoans.noFilteredDesc)
            : t((m) => m.SharedLoans.noLoansDesc)}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {hasLoans && onResetFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="gap-1.5"
          >
            <RotateCcwIcon className="size-3.5" />
            <span>{t((m) => m.SharedLoans.clearFilters)}</span>
          </Button>
        ) : onAdd ? (
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <PlusIcon className="size-3.5" />
            <span>{t((m) => m.SharedLoans.recordFirstLoan)}</span>
          </Button>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
