import { PageTitle } from "@/components/common/pages/page-title";

import { cn } from "@/lib/utils";

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
	return <PageTitle title={cn("Welcome back ", firstName ? firstName : "")} />;
}
