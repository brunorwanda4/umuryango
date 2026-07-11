"use client";

import { Loader2Icon } from "lucide-react";
import { useLinkStatus } from "next/link";
import { SidebarIcon, type SidebarIconSource } from "./sidebar-icon";

export function LinkLoadingIndicator({
  icon,
  title,
  isOpen,
}: {
  icon: SidebarIconSource;
  title: string;
  isOpen: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? (
        <Loader2Icon size={24} className="size-5 animate-spin" />
      ) : (
        <SidebarIcon icon={icon} className="size-5" />
      )}
      {isOpen ? <span>{title}</span> : null}
    </>
  );
}
