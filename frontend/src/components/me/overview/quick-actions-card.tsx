import type { LucideIcon } from "lucide-react";
import {
  CalendarPlusIcon,
  FileTextIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import {
  DashboardActionGrid,
  DashboardActionTile,
} from "@/components/common/dashboard/dashboard-action-grid";
import { DashboardSectionCard } from "@/components/common/dashboard/dashboard-section-card";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";

const actions: Array<{
  href: string;
  key:
    | "addIncome"
    | "addExpense"
    | "addLoan"
    | "addPlan"
    | "openDocuments"
    | "openFamilies";
  icon: LucideIcon;
}> = [
  { href: "/me/money/income", key: "addIncome", icon: LandmarkIcon },
  { href: "/me/money/expenses", key: "addExpense", icon: ReceiptTextIcon },
  { href: "/me/money/loans", key: "addLoan", icon: HandCoinsIcon },
  { href: "/me/plans", key: "addPlan", icon: CalendarPlusIcon },
  { href: "/me/documents", key: "openDocuments", icon: FileTextIcon },
  { href: "/family", key: "openFamilies", icon: UsersIcon },
];

export function QuickActionsCard() {
  const t = createTranslator("PersonalOverview.quickActionsCard");

  return (
    <DashboardSectionCard
      title={t((m) => m.PersonalOverview.quickActionsCard.title)}
      description={t((m) => m.PersonalOverview.quickActionsCard.description)}
      footerClassName="flex items-start gap-3"
      footer={
        <>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileTextIcon className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">
              {t((m) => m.PersonalOverview.quickActionsCard.documentsTitle)}
            </p>
            <p className="text-muted-foreground text-xs">
              {t(
                (m) => m.PersonalOverview.quickActionsCard.documentsUnavailable,
              )}
            </p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/me/documents">
              {t((m) => m.PersonalOverview.quickActionsCard.open)}
            </Link>
          </Button>
        </>
      }
    >
      <DashboardActionGrid>
        {actions.map((action) => (
          <DashboardActionTile
            key={action.key}
            href={action.href}
            icon={<action.icon data-icon="inline-start" aria-hidden="true" />}
            label={t(action.key)}
          />
        ))}
      </DashboardActionGrid>
    </DashboardSectionCard>
  );
}
