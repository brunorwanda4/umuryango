import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoanPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full min-w-0">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Hero Vault Skeleton */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="space-y-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-44" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <Skeleton className="h-2 w-full rounded-full" />
      </Card>

      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Filter Bar Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Loan Cards Skeleton */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((key) => (
          <Card
            key={key}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-16 ml-auto rounded-full" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
