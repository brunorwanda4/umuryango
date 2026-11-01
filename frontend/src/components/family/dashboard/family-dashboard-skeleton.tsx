import {
  DashboardGrid,
  DashboardShell,
} from "@/components/common/dashboard/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { createTranslator } from "@/i18n/translate";

const t = createTranslator("FamilyDashboard");

const sectionSkeletons = [
  "money",
  "attention",
  "contributions",
  "projects",
  "members",
  "loans",
] as const;

export function FamilyDashboardSkeleton() {
  return (
    <output
      className="block min-w-0"
      aria-label={t((m) => m.FamilyDashboard.loadingAria)}
    >
      <DashboardShell>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>

        <Skeleton className="h-32 rounded-2xl" />

        <DashboardGrid>
          {sectionSkeletons.map((item) => (
            <Skeleton key={item} className="h-80 rounded-2xl" />
          ))}
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        </DashboardGrid>
      </DashboardShell>
    </output>
  );
}
