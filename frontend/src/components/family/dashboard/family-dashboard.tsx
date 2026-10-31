import { AlertCircleIcon } from "lucide-react";
import { DashboardHeader } from "@/components/common/dashboard/dashboard-header";
import {
  DashboardGrid,
  DashboardShell,
} from "@/components/common/dashboard/dashboard-shell";
import type { LoanRecord } from "@/components/family/money/loans/types-and-schemas";
import type { MoneyOverview } from "@/components/family/money/types";
import type { ProjectsOverview } from "@/components/family/projects/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createTranslator } from "@/i18n/translate";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import { resolveCurrentFamilyMember } from "./dashboard-data";
import { FamilyActivityFeed } from "./family-activity-feed";
import { FamilyDashboardSkeleton } from "./family-dashboard-skeleton";
import {
  FamilyActiveProjectsCard,
  FamilyAttentionCard,
  FamilyContributionsOverviewCard,
  FamilyFinancialSummary,
  FamilyLoansOverviewCard,
  FamilyMoneyOverviewCard,
  FamilyQuickActionsCard,
} from "./family-finance-dashboard";
import { FamilyMembersOverview } from "./family-members-overview";
import type {
  ContributionsOverview,
  FamilyAuditEvent,
  FamilyDetail,
  RejectedTransactionRow,
} from "./types";

const t = createTranslator("FamilyDashboard");

export function FamilyDashboard({
  family,
  currentUserId = null,
  currentUserFullName = null,
  money,
  rejectedTransactions = null,
  contributions = null,
  projects = null,
  loans = null,
  auditEvents = null,
  warnings = [],
  moneyMessage,
}: {
  family: FamilyDetail;
  currentUserId?: string | null;
  currentUserFullName?: string | null;
  money: MoneyOverview | null;
  rejectedTransactions?: RejectedTransactionRow[] | null;
  contributions?: ContributionsOverview | null;
  projects?: ProjectsOverview | null;
  loans?: LoanRecord[] | null;
  auditEvents?: FamilyAuditEvent[] | null;
  warnings?: string[];
  moneyMessage?: string;
}) {
  const { currentMember, firstName } = resolveCurrentFamilyMember(
    family,
    currentUserId,
    currentUserFullName,
  );
  const memberCount = family.memberCount || family.members.length;
  const combinedWarnings =
    warnings.length > 0
      ? [...new Set(warnings)]
      : moneyMessage
        ? [
            t((m) => m.FamilyDashboard.moneyLoadErrorDescription, {
              detail: moneyMessage,
            }),
          ]
        : [];

  return (
    <DashboardShell>
      <DashboardHeader
        title={
          firstName
            ? t((m) => m.FamilyDashboard.welcomeBack, { name: firstName })
            : t((m) => m.FamilyDashboard.welcomeBackDefault)
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{family.name}</Badge>
            <Badge variant="outline">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant="outline">
              {t((m) => m.FamilyDashboard.membersCount, {
                count: memberCount,
              })}
            </Badge>
            <Badge variant="outline">
              {t((m) => m.FamilyDashboard.reportingPeriod)}
            </Badge>
          </div>
        }
        subtitle={family.description ?? undefined}
      />

      {combinedWarnings.length > 0 ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{t((m) => m.FamilyDashboard.warningsTitle)}</AlertTitle>
          <AlertDescription>{combinedWarnings.join(" ")}</AlertDescription>
        </Alert>
      ) : null}

      <FamilyFinancialSummary family={family} money={money} />

      <FamilyQuickActionsCard family={family} />

      <DashboardGrid>
        <FamilyMoneyOverviewCard family={family} money={money} />

        <FamilyAttentionCard
          family={family}
          currentMember={currentMember}
          money={money}
          contributions={contributions}
          rejectedTransactions={rejectedTransactions}
        />

        <FamilyContributionsOverviewCard
          family={family}
          contributions={contributions}
        />

        <FamilyActiveProjectsCard family={family} projects={projects} />

        <FamilyMembersOverview family={family} />

        <FamilyLoansOverviewCard family={family} loans={loans} />

        <FamilyActivityFeed
          family={family}
          money={money}
          contributions={contributions}
          projects={projects}
          auditEvents={auditEvents}
          className="lg:col-span-2"
        />
      </DashboardGrid>
    </DashboardShell>
  );
}

export { FamilyDashboardSkeleton };
