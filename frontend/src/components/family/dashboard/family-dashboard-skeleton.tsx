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

const quickActionSkeletons = [
  "members",
  "money",
  "announcements",
  "settings",
  "events",
  "projects",
] as const;

const memberSkeletons = ["head", "admin", "member"] as const;

export function FamilyDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewSkeletons.map((item) => (
          <Skeleton key={item} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid auto-cols-[minmax(10rem,1fr)] grid-flow-col gap-2 overflow-hidden rounded-xl border bg-card p-2 sm:grid-flow-row sm:grid-cols-3 lg:grid-cols-6">
          {quickActionSkeletons.map((item) => (
            <Skeleton key={item} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <Skeleton className="h-[34rem] w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl lg:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberSkeletons.map((item) => (
            <Skeleton key={item} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {moduleSkeletons.map((item) => (
            <Skeleton key={item} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
