import {
  CheckCircle2Icon,
  FileClockIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import CommonOverviewCardDisplay from "@/components/common/overview-card-display";
import { createTranslator } from "@/i18n/translate";
import type { ApprovalAnalyticsModel } from "./types";

export function ApprovalSummaryCards({
  analytics,
  currency,
}: {
  analytics: ApprovalAnalyticsModel;
  currency: string;
}) {
  const t = createTranslator("FamilyApprovals");
  const cards = [
    {
      title: t((m) => m.FamilyApprovals.pendingApprovalsTitle),
      value: analytics.pendingCount.toLocaleString(),
      icon: FileClockIcon,
      image: "/images/icons/documents.png",
    },
    {
      title: t((m) => m.FamilyApprovals.approvedToday),
      value: analytics.approvedToday.toLocaleString(),
      icon: CheckCircle2Icon,
      image: "/images/icons/approved.png",
    },
    {
      title: t((m) => m.FamilyApprovals.rejectedToday),
      value: analytics.rejectedToday.toLocaleString(),
      icon: XCircleIcon,
      image: "/images/icons/audit.png",
    },
    {
      title: t((m) => m.FamilyApprovals.totalApprovedThisMonth),
      value: analytics.approvedThisMonthMinorUnits,
      icon: ShieldCheckIcon,
      image: "/images/icons/wallet.png",
      isMoney: true,
    },
  ];

  return (
    <CommonOverviewCardDisplay
      cardDescriptionClassName="flex items-center text-sm font-medium leading-5 text-muted-foreground max-sm:text-sm max-sm:font-medium "
      cardHeaderClassName="flex-col items-start justify-between gap-4 py-4"
      cardTitleClassName="whitespace-normal leading-tight tracking-normal sm:text-3xl"
      className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4"
      iconPosition="start"
      cards={cards.map((card) => ({
        className: "h-full border-border/80 py-0 shadow-sm",
        description: card.title,
        iconSource: {
          image: { src: card.image },
          line: card.icon,
        },
        value: card.isMoney ? (
          <CompactMoney currency={currency} value={card.value} />
        ) : (
          card.value
        ),
      }))}
    />
  );
}
