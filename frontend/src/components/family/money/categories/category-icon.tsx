import { getLucideIcon } from "@/lib/lucide-icons";
import type { MoneyCategory } from "./types-and-constants";

export function CategoryIcon({ category }: { category: MoneyCategory }) {
  const Icon = getLucideIcon(category.icon);

  return (
    <span className="flex size-9 items-center justify-center rounded-md border bg-background">
      <Icon
        aria-hidden="true"
        className="size-4"
        style={{ color: category.color }}
      />
    </span>
  );
}
