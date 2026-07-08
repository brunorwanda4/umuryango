import { InfoIcon } from "lucide-react";
import { PageTitle } from "@/components/common/pages/page-title";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import { enrichWithDemoData } from "./dashboard-data";
import { FamilyActivityFeed } from "./family-activity-feed";
import { DashboardCharts } from "./family-dashboard-charts";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import { FamilyFinanceDashboard } from "./family-finance-dashboard";
import { FamilyMembersOverview } from "./family-members-overview";
import { FamilyWorkspaceGrid } from "./family-workspace-grid";
import type { FamilyDetail } from "./types";

export function FamilyDashboard({ family }: { family: FamilyDetail }) {
  const isDemo = family.members.length <= 1;
  const displayFamily = isDemo ? enrichWithDemoData(family) : family;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={`Welcome to ${displayFamily.name}`}
        description="Extended family fund for monthly welfare support, ceremonies, education, and shared projects."
        badge={AUTHORITY_LABELS[displayFamily.authority]}
      />
      <Separator />

      {isDemo && (
        <Alert>
          <InfoIcon className="size-4" aria-hidden="true" />
          <AlertTitle>Welcome to your Rwanda Family Dashboard Demo</AlertTitle>
          <AlertDescription>
            We've populated this dashboard with demo members, charts, and
            activities to show you how a fully active family workspace looks. As
            you invite your real family members and record transactions, this
            demo data will automatically be replaced with your own.
          </AlertDescription>
        </Alert>
      )}

      <FamilyFinanceDashboard family={displayFamily} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardCharts family={displayFamily} />
        <FamilyActivityFeed family={displayFamily} />
      </div>
      <FamilyMembersOverview family={displayFamily} />
      <FamilyWorkspaceGrid family={displayFamily} />
    </div>
  );
}

export { FamilyDashboardSkeleton };
