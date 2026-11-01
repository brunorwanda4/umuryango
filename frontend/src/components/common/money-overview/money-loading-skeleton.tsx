import { Skeleton } from "@/components/ui/skeleton";
import {
  MoneyOverviewShell,
  MoneyOverviewTopGrid,
} from "./money-overview-shell";

export function MoneyOverviewLoadingSkeleton() {
  return (
    <MoneyOverviewShell>
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Period Selector Skeleton */}
      <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />

      {/* Top Grid: Hero Card + Category Breakdown */}
      <MoneyOverviewTopGrid>
        <div className="lg:col-span-8">
          <Skeleton className="h-84 sm:h-96 w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-84 sm:h-96 w-full rounded-2xl" />
        </div>
      </MoneyOverviewTopGrid>

      {/* Ledger Skeleton */}
      <Skeleton className="h-72 w-full rounded-2xl" />

      {/* Supporting Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </MoneyOverviewShell>
  );
}
