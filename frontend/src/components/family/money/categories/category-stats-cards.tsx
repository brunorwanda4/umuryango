import {
  ArchiveIcon,
  BanknoteIcon,
  CircleIcon,
  FolderCogIcon,
  UtensilsIcon,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { getCategoryStats } from "./types-and-constants";

export function CategoryStatsCards({
  stats,
}: {
  stats: ReturnType<typeof getCategoryStats>;
}) {
  const cards = [
    { title: "Total Categories", value: stats.total, icon: FolderCogIcon },
    { title: "Income Categories", value: stats.income, icon: BanknoteIcon },
    { title: "Expense Categories", value: stats.expense, icon: UtensilsIcon },
    { title: "Active Categories", value: stats.active, icon: CircleIcon },
    { title: "Inactive Categories", value: stats.inactive, icon: ArchiveIcon },
  ];

  return (
    <section
      aria-label="Category statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} size="sm">
            <CardHeader>
              <CardAction>
                <Icon className="size-4 text-muted-foreground" />
              </CardAction>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
