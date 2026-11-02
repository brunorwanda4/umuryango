import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlanPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full min-w-0">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Hero Progress Skeleton */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <div className="space-y-1.5 py-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      </Card>

      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-full rounded-2xl" />

      {/* Search Input Skeleton */}
      <Skeleton className="h-9 w-full rounded-xl" />

      {/* Plan Cards Skeleton */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((key) => (
          <Card
            key={key}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-2xl" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>

            <Skeleton className="h-2 w-full rounded-full" />

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
