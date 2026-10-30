import {
  ArrowDownIcon,
  ArrowUpIcon,
  LandmarkIcon,
  SparklesIcon,
  TargetIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import type { MoneyOverview } from "../money/types";
import { formatMinorUnits, formatTitle } from "../money/utils";
import { formatRelativeTime, getKinshipLabel } from "./dashboard-data";
import type { FamilyDetail } from "./types";

const MAX_ENTRIES = 6;

type ActivityEntry = {
  id: string;
  type:
    | "member_joined"
    | "family_created"
    | "expense_recorded"
    | "income_recorded"
    | "goal_updated"
    | "contribution_paid";
  name: string;
  avatarUrl: string | null;
  description: string;
  timestamp: Date;
};

function buildActivityEntries(
  family: FamilyDetail,
  money: MoneyOverview | null,
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const member of family.members) {
    const joinedAt = new Date(member.joinedAt);

    if (Number.isNaN(joinedAt.getTime())) {
      continue;
    }

    const roleLabel = AUTHORITY_LABELS[member.authority];
    const kinship = getKinshipLabel(member);

    entries.push({
      id: `member-${member.id}`,
      type: "member_joined",
      name: member.fullName,
      avatarUrl: member.avatarUrl,
      description: `joined as ${roleLabel} - ${kinship}`,
      timestamp: joinedAt,
    });
  }

  const createdAt = new Date(family.createdAt);

  if (!Number.isNaN(createdAt.getTime())) {
    entries.push({
      id: `family-${family.id}`,
      type: "family_created",
      name: family.name,
      avatarUrl: null,
      description: "family was created",
      timestamp: createdAt,
    });
  }

  const currency = money?.currency ?? family.defaultCurrency;

  for (const record of money?.records ?? []) {
    const timestamp = new Date(record.date ?? "");

    if (Number.isNaN(timestamp.getTime())) {
      continue;
    }

    const recordType = record.type.toLowerCase();
    const isIncome = recordType.includes("income");
    const isExpense = recordType.includes("expense");
    const amount = formatMinorUnits(record.amountMinorUnits, currency);
    const category = record.category ?? formatTitle(record.title);

    entries.push({
      id: `money-${record.id}`,
      type: isIncome
        ? "income_recorded"
        : isExpense
          ? "expense_recorded"
          : "contribution_paid",
      name: record.createdBy ?? "Family",
      avatarUrl: null,
      description: isIncome
        ? `recorded income of ${amount} from ${category}`
        : isExpense
          ? `recorded an expense of ${amount} for ${category}`
          : `recorded ${amount} for ${category}`,
      timestamp,
    });
  }

  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return entries;
}

export function FamilyActivityFeed({
  family,
  money,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
}) {
  const allEntries = buildActivityEntries(family, money);
  const visibleEntries = allEntries.slice(0, MAX_ENTRIES);

  return (
    <Card className="card card-border gap-0 rounded-[20px] py-5 shadow-sm">
      <CardHeader className="px-5 pb-3.5">
        <CardTitle className="font-fraunces text-xl">Recent activity</CardTitle>
        <CardDescription>
          Your latest personal and family actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        <div className="flex flex-col">
          {visibleEntries.map((entry) => {
            let Icon = UserPlusIcon;

            if (entry.type === "family_created") {
              Icon = SparklesIcon;
            } else if (entry.type === "expense_recorded") {
              Icon = ArrowUpIcon;
            } else if (entry.type === "income_recorded") {
              Icon = ArrowDownIcon;
            } else if (entry.type === "goal_updated") {
              Icon = TargetIcon;
            } else if (entry.type === "contribution_paid") {
              Icon = LandmarkIcon;
            }

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{entry.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {entry.description}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
