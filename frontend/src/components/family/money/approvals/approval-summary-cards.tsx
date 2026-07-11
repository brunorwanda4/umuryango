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
import type { ApprovalAnalyticsModel } from "./types";

export function ApprovalSummaryCards({
  analytics,
  currency,
}: {
  analytics: ApprovalAnalyticsModel;
  currency: string;
}) {
  const cards = [
    {
      title: "Pending Approvals",
      value: analytics.pendingCount.toLocaleString(),
      helper: "Records waiting for review",
      icon: FileClockIcon,
    },
    {
      title: "Approved Today",
      value: analytics.approvedToday.toLocaleString(),
      helper: "Transactions locked today",
      icon: CheckCircle2Icon,
    },
    {
      title: "Rejected Today",
      value: analytics.rejectedToday.toLocaleString(),
      helper: "Rejected with audit history",
      icon: XCircleIcon,
    },
    {
      title: "Total Approved This Month",
      value: analytics.approvedThisMonthMinorUnits,
      helper: "Persisted approved transactions",
      icon: ShieldCheckIcon,
      isMoney: true,
    },
    {
      title: "Average Approval Time",
      value: analytics.averageApprovalHours
        ? `${analytics.averageApprovalHours.toFixed(1)}h`
        : "No data",
      helper: "Created to approved timestamp",
      icon: Clock3Icon,
    },
    {
      title: "My Pending Reviews",
      value: analytics.myPendingReviews.toLocaleString(),
      helper: "Visible to this account",
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
