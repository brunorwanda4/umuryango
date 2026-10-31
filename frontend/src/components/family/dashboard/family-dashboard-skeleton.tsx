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
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-64 rounded-[22px]" />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>

        <Skeleton className="h-36 rounded-xl" />

        <DashboardGrid>
          {sectionSkeletons.map((item) => (
            <Skeleton key={item} className="h-96 rounded-xl" />
          ))}
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </DashboardGrid>
      </DashboardShell>
    </output>
  );
}
