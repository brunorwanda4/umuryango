import { CircleIcon, icons, type LucideIcon } from "lucide-react";

const legacyIconNames: Record<string, string> = {
  "Circle dollar": "CircleDollarSign",
  "Graduation cap": "GraduationCap",
  "Hand coins": "HandCoins",
  "Heart pulse": "HeartPulse",
};

export type LucideIconName = keyof typeof icons;

export type LucideIconOption = {
  name: LucideIconName;
  label: string;
  searchValue: string;
  Icon: LucideIcon;
};

export function formatLucideIconName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

export function normalizeLucideIconName(name: string | null | undefined) {
  if (!name) return "Circle";
  return legacyIconNames[name] ?? name.replace(/\s+/g, "");
}

export function isLucideIconName(name: string | null | undefined) {
  const normalizedName = normalizeLucideIconName(name);
  return normalizedName in icons;
}

export function getLucideIcon(name: string | null | undefined): LucideIcon {
  const normalizedName = normalizeLucideIconName(name) as LucideIconName;
  return icons[normalizedName] ?? CircleIcon;
}

export const lucideIconOptions: LucideIconOption[] = Object.entries(icons)
  .map(([name, Icon]) => {
    const label = formatLucideIconName(name);

    return {
      Icon,
      label,
      name: name as LucideIconName,
      searchValue: `${name} ${label}`.toLowerCase(),
    };
  })
  .toSorted((first, second) => first.label.localeCompare(second.label));
