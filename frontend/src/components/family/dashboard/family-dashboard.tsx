import { PageTitle } from "@/components/common/pages/page-title";
import { Separator } from "@/components/ui/separator";
import { FamilyActivityFeed } from "./family-activity-feed";
import { DashboardCharts } from "./family-dashboard-charts";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import { FamilyFinanceDashboard } from "./family-finance-dashboard";
import { FamilyMembersOverview } from "./family-members-overview";
import { FamilyWorkspaceGrid } from "./family-workspace-grid";
import type { FamilyDetail } from "./types";
import { AUTHORITY_LABELS } from "@/lib/family-access";

export function FamilyDashboard({ family }: { family: FamilyDetail }) {
	return (
		<div className="flex flex-col gap-6">
      <PageTitle title={`Welcome to ${family.name}`} description="Extended family fund for monthly welfare support, ceremonies, education, and shared projects." badge={AUTHORITY_LABELS[family.authority]} />
			<Separator />
			<FamilyFinanceDashboard family={family} />
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<DashboardCharts family={family} />
				<FamilyActivityFeed family={family} />
			</div>
			<FamilyMembersOverview family={family} />
			<FamilyWorkspaceGrid family={family} />
		</div>
	);
}

export { FamilyDashboardSkeleton };
