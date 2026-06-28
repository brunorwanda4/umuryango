import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const overviewSkeletons = [
  "members",
  "access",
  "currency",
  "contributions",
] as const;

const moduleSkeletons = [
  "money",
  "contributions",
  "savings",
  "debts",
  "projects",
  "events",
  "reports",
  "announcements",
] as const;

export function FamilyDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewSkeletons.map((item) => (
          <Skeleton key={item} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {moduleSkeletons.map((item) => (
          <Skeleton key={item} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
