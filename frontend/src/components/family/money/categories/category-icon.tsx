import { CircleIcon } from "lucide-react";
import { type MoneyCategory, categoryIconMap } from "./types-and-constants";

export function CategoryIcon({ category }: { category: MoneyCategory }) {
  const Icon = categoryIconMap[category.icon] ?? CircleIcon;

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
