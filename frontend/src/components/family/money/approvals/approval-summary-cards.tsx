import {
  CheckCircle2Icon,
  Clock3Icon,
  FileClockIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      title: t("pendingApprovalsTitle"),
      value: analytics.pendingCount.toLocaleString(),
      helper: t("pendingApprovalsHelper"),
      icon: FileClockIcon,
    },
    {
      title: t("approvedToday"),
      value: analytics.approvedToday.toLocaleString(),
      helper: t("approvedTodayHelper"),
      icon: CheckCircle2Icon,
    },
    {
      title: t("rejectedToday"),
      value: analytics.rejectedToday.toLocaleString(),
      helper: t("rejectedTodayHelper"),
      icon: XCircleIcon,
    },
    {
      title: t("totalApprovedThisMonth"),
      value: analytics.approvedThisMonthMinorUnits,
      helper: t("totalApprovedThisMonthHelper"),
      icon: ShieldCheckIcon,
      isMoney: true,
    },
    {
      title: t("averageApprovalTime"),
      value: analytics.averageApprovalHours
        ? `${analytics.averageApprovalHours.toFixed(1)}h`
        : t("noData"),
      helper: t("averageApprovalTimeHelper"),
      icon: Clock3Icon,
    },
    {
      title: t("myPendingReviews"),
      value: analytics.myPendingReviews.toLocaleString(),
      helper: t("myPendingReviewsHelper"),
      icon: ListChecksIcon,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader>
              <CardAction>
                <span className="flex size-9 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
              </CardAction>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="font-semibold text-2xl tracking-tight">
                {card.isMoney ? (
                  <CompactMoney currency={currency} value={card.value} />
                ) : (
                  card.value
                )}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{card.helper}</p>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
