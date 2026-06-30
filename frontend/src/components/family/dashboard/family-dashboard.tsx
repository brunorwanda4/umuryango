import { Separator } from "@/components/ui/separator";
import { DashboardCharts } from "./family-dashboard-charts";
import { FamilyDashboardHeader } from "./family-dashboard-header";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import { FamilyFinanceDashboard } from "./family-finance-dashboard";
import { FamilyMembersOverview } from "./family-members-overview";
import { FamilyOverviewCards } from "./family-overview-cards";
import { FamilyWorkspaceGrid } from "./family-workspace-grid";
import { NextStepsCard } from "./next-steps-card";
import type { FamilyDetail } from "./types";

export function FamilyDashboard({ family }: { family: FamilyDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <FamilyDashboardHeader family={family} />
      <Separator />
      <FamilyOverviewCards family={family} />
      <FamilyFinanceDashboard family={family} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardCharts family={family} />
        <NextStepsCard family={family} />
      </div>
      <FamilyMembersOverview family={family} />
      <FamilyWorkspaceGrid family={family} />
    </div>
  );
}

export { FamilyDashboardSkeleton };
