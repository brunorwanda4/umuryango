import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import type { MoneyOverview } from "../money/types";
import { FamilyActivityFeed } from "./family-activity-feed";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import {
  FamilyFinanceDashboard,
  FamilyQuickActions,
} from "./family-finance-dashboard";
import type { FamilyDetail } from "./types";

const t = createTranslator("FamilyDashboard");

export function FamilyDashboard({
  family,
  money,
  moneyMessage,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
}) {
  const currentMember = family.members.find(
    (member) => member.authority === family.authority,
  );
  const greetingName = currentMember?.fullName.split(" ")[0] ?? family.name;

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 pb-6">
      <header className="px-1 pb-1">
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-fraunces font-semibold text-[clamp(28px,6vw,40px)] leading-[1.1] tracking-[-0.01em]">
            {t((m) => m.FamilyDashboard.welcomeBack, { name: greetingName })}
          </h1>
          <Badge variant="secondary">
            {AUTHORITY_LABELS[family.authority]}
          </Badge>
        </div>
      </header>

      {moneyMessage ? (
        <Alert>
          <InfoIcon className="size-4" aria-hidden="true" />
          <AlertTitle>
            {t((m) => m.FamilyDashboard.moneyLoadErrorTitle)}
          </AlertTitle>
          <AlertDescription>
            {t((m) => m.FamilyDashboard.moneyLoadErrorDescription, {
              detail: moneyMessage,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <FamilyFinanceDashboard family={family} money={money} />
      <FamilyActivityFeed family={family} money={money} />
      <FamilyQuickActions family={family} />
    </div>
  );
}

export { FamilyDashboardSkeleton };
