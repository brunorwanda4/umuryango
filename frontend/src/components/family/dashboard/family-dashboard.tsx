import { InfoIcon } from "lucide-react";
import { PageTitle } from "@/components/common/pages/page-title";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import type { MoneyOverview } from "../money/types";
import { FamilyActivityFeed } from "./family-activity-feed";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import { FamilyFinanceDashboard } from "./family-finance-dashboard";
import { FamilyMembersOverview } from "./family-members-overview";
import type { FamilyDetail } from "./types";

export function FamilyDashboard({
  family,
  money,
  moneyMessage,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={`Welcome to ${family.name}`}
        description="Extended family fund for monthly welfare support, ceremonies, education, and shared projects."
        badge={AUTHORITY_LABELS[family.authority]}
      />
      <Separator />

      {moneyMessage ? (
        <Alert>
          <InfoIcon className="size-4" aria-hidden="true" />
          <AlertTitle>Money records could not load</AlertTitle>
          <AlertDescription>
            Family profile and member data loaded, but the financial dashboard
            could not read persisted money records. Detail: {moneyMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <FamilyFinanceDashboard family={family} money={money} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <FamilyActivityFeed family={family} money={money} />
      </div>
      <FamilyMembersOverview family={family} />
    </div>
  );
}

export { FamilyDashboardSkeleton };
