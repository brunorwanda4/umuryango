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
import type { FamilyDetail } from "./types";

export function FamilyOverviewCards({ family }: { family: FamilyDetail }) {
  const cards = [
    {
      title: "Family members",
      value: family.memberCount.toLocaleString(),
      description: family.memberCount === 1 ? "person joined" : "people joined",
      icon: UsersIcon,
    },
    {
      title: "Your access",
      value: AUTHORITY_LABELS[family.authority],
      description: "What you can do here",
      icon: ShieldCheckIcon,
    },
    {
      title: "Main currency",
      value: family.defaultCurrency,
      description: "Used for family records",
      icon: CircleDollarSignIcon,
    },
    {
      title: "Contributions",
      value: family.contributionCadence,
      description: "Expected family rhythm",
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
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div className="min-w-0">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="mt-1 truncate text-2xl">
                  {card.value}
                </CardTitle>
              </div>
              <Icon className="size-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
