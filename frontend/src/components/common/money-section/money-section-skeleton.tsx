import { Skeleton } from "@/components/ui/skeleton";

export function MoneySectionSkeleton() {
  return (
    <div
      className="flex min-w-0 max-w-full flex-col gap-5 sm:gap-6 pb-12"
      aria-busy="true"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-80 bg-zinc-800" />
        </div>
        <Skeleton className="h-9 w-36 bg-zinc-800 shrink-0" />
      </div>

      {/* Top Grid: Hero (7-8 cols) + Actions / Breakdown (4-5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7 xl:col-span-7">
          {/* Directional Hero Card Skeleton */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-40 bg-zinc-800" />
              <Skeleton className="h-5 w-16 bg-zinc-800 rounded-full" />
            </div>
            <Skeleton className="h-10 w-60 bg-zinc-800" />
            <Skeleton className="h-3 w-48 bg-zinc-800" />
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <Skeleton className="h-20 bg-zinc-900 rounded-2xl" />
              <Skeleton className="h-20 bg-zinc-900 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Quick Actions Skeleton */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <Skeleton className="h-4 w-32 bg-zinc-800" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 bg-zinc-900 rounded-xl" />
              <Skeleton className="h-16 bg-zinc-900 rounded-xl" />
              <Skeleton className="h-16 bg-zinc-900 rounded-xl" />
              <Skeleton className="h-16 bg-zinc-900 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32 bg-zinc-800" />
          <Skeleton className="h-4 w-20 bg-zinc-800" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 bg-zinc-800 rounded-full" />
          <Skeleton className="h-7 w-20 bg-zinc-800 rounded-full" />
          <Skeleton className="h-7 w-20 bg-zinc-800 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-14 w-full bg-zinc-900 rounded-xl" />
          <Skeleton className="h-14 w-full bg-zinc-900 rounded-xl" />
          <Skeleton className="h-14 w-full bg-zinc-900 rounded-xl" />
          <Skeleton className="h-14 w-full bg-zinc-900 rounded-xl" />
        </div>
      </div>

      <span className="sr-only">Loading money section</span>
    </div>
  );
}
