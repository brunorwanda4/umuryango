import { getLucideIcon } from "@/lib/lucide-icons";
import type { MoneyCategory } from "./types-and-constants";

export function CategoryIcon({ category }: { category: MoneyCategory }) {
  const Icon = getLucideIcon(category.icon);
  const color = category.color || "var(--muted-foreground)";

  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-md border"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <Icon aria-hidden="true" className="size-4" style={{ color }} />
    </span>
  );
}
