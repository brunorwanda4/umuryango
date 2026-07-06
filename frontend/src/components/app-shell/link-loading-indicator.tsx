"use client";

import { Loader2Icon, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";

export function LinkLoadingIndicator({
  icon: Icon,
  title,
  isOpen,
}: {
  icon: LucideIcon;
  title: string;
  isOpen: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? (
        <Loader2Icon size={24} className="size-5 animate-spin" />
      ) : (
        <Icon size={24} className="size-5" />
      )}
      {isOpen ? <span>{title}</span> : null}
    </>
  );
}
