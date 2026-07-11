"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type SidebarIconSource =
  | LucideIcon
  | {
      src: string;
      alt?: string;
    };

export function SidebarIcon({
  icon,
  className,
}: {
  icon: SidebarIconSource;
  className?: string;
}) {
  if (typeof icon === "function") {
    const Icon = icon;

    return <Icon aria-hidden="true" className={cn("shrink-0", className)} />;
  }

  return (
    <Image
      src={icon.src}
      alt={icon.alt ?? ""}
      width={24}
      height={24}
      aria-hidden={icon.alt ? undefined : "true"}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
