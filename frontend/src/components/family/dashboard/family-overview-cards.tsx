import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTHORITY_LABELS } from "@/lib/family-access";
import { getMembersJoinedThisMonth } from "./dashboard-data";
import type { FamilyDetail } from "./types";

export function FamilyOverviewCards({ family }: { family: FamilyDetail }) {
  const membersJoinedThisMonth = getMembersJoinedThisMonth(family);
  const cards = [
    {
      title: "Family members",
      value: family.memberCount.toLocaleString(),
      description: family.memberCount === 1 ? "person joined" : "people joined",
      signal:
        membersJoinedThisMonth > 0
          ? `+${membersJoinedThisMonth} this month`
          : "No new members this month",
      icon: UsersIcon,
    },
    {
      title: "Your access",
      value: AUTHORITY_LABELS[family.authority],
      description: "What you can do here",
      signal:
        family.authority === "HEAD"
          ? "Full access"
          : `${family.capabilities.length.toLocaleString()} permissions`,
      icon: ShieldCheckIcon,
    },
    {
      title: "Main currency",
      value: family.defaultCurrency,
      description: "Used for family records",
      signal: family.country,
      icon: CircleDollarSignIcon,
    },
    {
      title: "Contributions",
      value: family.contributionCadence,
      description: "Expected family rhythm",
      signal: "Persisted records",
      icon: CalendarClockIcon,
    },
  ];

  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Family overview"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-primary/10 p-2.5">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate font-bold text-2xl">
                  {card.value}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  {card.description}
                </p>
                <span className="shrink-0 rounded-full border bg-muted/30 px-2 py-0.5 text-muted-foreground text-xs">
                  {card.signal}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
