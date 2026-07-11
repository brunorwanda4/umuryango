"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type SidebarIconStyle = "line" | "image";

const SIDEBAR_ICON_STYLE_STORAGE_KEY = "rwanda-family-sidebar-icon-style";
const SIDEBAR_ICON_STYLE_EVENT = "rwanda-family-sidebar-icon-style-change";
const DEFAULT_SIDEBAR_ICON_STYLE: SidebarIconStyle = "line";

export type SidebarIconSource =
  | LucideIcon
  | {
      src: string;
      alt?: string;
    }
  | {
      image: {
        src: string;
        alt?: string;
      };
      line: LucideIcon;
    };

function isSidebarIconStyle(value: string | null): value is SidebarIconStyle {
  return value === "line" || value === "image";
}

function readSidebarIconStyle() {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_ICON_STYLE;
  }

  const stored = window.localStorage.getItem(SIDEBAR_ICON_STYLE_STORAGE_KEY);

  return isSidebarIconStyle(stored) ? stored : DEFAULT_SIDEBAR_ICON_STYLE;
}

export function useSidebarIconStyle() {
  const [style, setStyleState] = useState<SidebarIconStyle>(
    DEFAULT_SIDEBAR_ICON_STYLE,
  );

  useEffect(() => {
    const syncStyle = () => setStyleState(readSidebarIconStyle());

    syncStyle();
    window.addEventListener("storage", syncStyle);
    window.addEventListener(SIDEBAR_ICON_STYLE_EVENT, syncStyle);

    return () => {
      window.removeEventListener("storage", syncStyle);
      window.removeEventListener(SIDEBAR_ICON_STYLE_EVENT, syncStyle);
    };
  }, []);

  const setStyle = (nextStyle: SidebarIconStyle) => {
    window.localStorage.setItem(SIDEBAR_ICON_STYLE_STORAGE_KEY, nextStyle);
    setStyleState(nextStyle);
    window.dispatchEvent(new Event(SIDEBAR_ICON_STYLE_EVENT));
  };

  return { style, setStyle };
}

export function SidebarIcon({
  icon,
  className,
}: {
  icon: SidebarIconSource;
  className?: string;
}) {
  const { style } = useSidebarIconStyle();

  if (typeof icon === "function") {
    const Icon = icon;

    return <Icon aria-hidden="true" className={cn("shrink-0", className)} />;
  }

  if ("line" in icon && style === "line") {
    const Icon = icon.line;

    return <Icon aria-hidden="true" className={cn("shrink-0", className)} />;
  }

  const image = "image" in icon ? icon.image : icon;

  return (
    <Image
      src={image.src}
      alt={image.alt ?? ""}
      width={24}
      height={24}
      aria-hidden={image.alt ? undefined : "true"}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
